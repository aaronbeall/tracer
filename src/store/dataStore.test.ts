jest.mock('@/services/db', () => {
  let nextDataPointId = 1;
  let nextSeriesId = 1;
  return {
    db: {
      init: jest.fn().mockResolvedValue(undefined),
      addDataPoint: jest.fn().mockImplementation(async () => nextDataPointId++),
      getAllDataPoints: jest.fn().mockResolvedValue([]),
      updateDataPoint: jest.fn().mockResolvedValue(undefined),
      deleteDataPoint: jest.fn().mockResolvedValue(undefined),
      addSeries: jest.fn().mockImplementation(async () => nextSeriesId++),
      getAllSeries: jest.fn().mockResolvedValue([]),
      updateSeries: jest.fn().mockResolvedValue(undefined),
      deleteSeries: jest.fn().mockResolvedValue(undefined),
      deleteDatabase: jest.fn().mockResolvedValue(undefined),
    },
  };
});

import { useDataStore } from './dataStore';

beforeEach(() => {
  useDataStore.setState({ dataPoints: [], series: [], isLoadingDataPoints: false, isLoadingSeries: false });
});

describe('addDataPoint / ensureSeriesExists', () => {
  it('merges series names case-insensitively into the first-seen canonical name', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Weight', value: 70 });
    await useDataStore.getState().addDataPoint({ series: 'weight', value: 71 });

    const state = useDataStore.getState();
    expect(state.series).toHaveLength(1);
    expect(state.series[0].name).toBe('Weight');
    expect(state.dataPoints.map((p) => p.series)).toEqual(['Weight', 'Weight']);
  });

  it('trims whitespace when creating a new series', async () => {
    await useDataStore.getState().addDataPoint({ series: '  Sales  ', value: 100 });
    expect(useDataStore.getState().series[0].name).toBe('Sales');
  });

  it('infers numeric vs text type from the first value', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Weight', value: 70 });
    await useDataStore.getState().addDataPoint({ series: 'Mood', value: 'Happy' });
    const state = useDataStore.getState();
    expect(state.series.find((s) => s.name === 'Weight')?.type).toBe('numeric');
    expect(state.series.find((s) => s.name === 'Mood')?.type).toBe('text');
  });

  it('infers a categorized series when a category is provided, and stores it on the point', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Exercise', value: 30, category: 'Running' });
    const state = useDataStore.getState();
    expect(state.series.find((s) => s.name === 'Exercise')?.type).toBe('categorized');
    expect(state.dataPoints[0]).toMatchObject({ series: 'Exercise', value: 30, category: 'Running' });
  });
});

describe('updateDataPoint', () => {
  it('infers the new series type from the existing value when only the series is changed', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Old', value: 42 });
    const pointId = useDataStore.getState().dataPoints[0].id;

    await useDataStore.getState().updateDataPoint(pointId, { series: 'New' });

    const state = useDataStore.getState();
    const newSeries = state.series.find((s) => s.name === 'New');
    expect(newSeries?.type).toBe('numeric');
    expect(state.dataPoints[0].series).toBe('New');
  });

  it('merges into an existing series case-insensitively when renaming', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Weight', value: 70 });
    await useDataStore.getState().addDataPoint({ series: 'Other', value: 1 });
    const otherPointId = useDataStore.getState().dataPoints[1].id;

    await useDataStore.getState().updateDataPoint(otherPointId, { series: 'weight' });

    const state = useDataStore.getState();
    expect(state.series.filter((s) => s.name.toLowerCase() === 'weight')).toHaveLength(1);
    expect(state.dataPoints[1].series).toBe('Weight');
  });
});

describe('deleteSeries', () => {
  it('cascades to delete the series and all of its data points', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Temp', value: 1 });
    await useDataStore.getState().addDataPoint({ series: 'Temp', value: 2 });
    await useDataStore.getState().addDataPoint({ series: 'Keep', value: 3 });
    const tempSeriesId = useDataStore.getState().series.find((s) => s.name === 'Temp')!.id;

    await useDataStore.getState().deleteSeries(tempSeriesId);

    const state = useDataStore.getState();
    expect(state.series.map((s) => s.name)).toEqual(['Keep']);
    expect(state.dataPoints.map((p) => p.series)).toEqual(['Keep']);
  });
});

describe('importBackup', () => {
  it('creates new series preserving full metadata and imports their points', async () => {
    await useDataStore.getState().importBackup({
      version: 1,
      exportedAt: 1000,
      series: [
        {
          id: 999,
          name: 'Weight',
          color: '#ff0000',
          emoji: '⚖️',
          unit: 'kg',
          type: 'numeric',
          goal: { target: 70, direction: 'at-most' },
          aggregation: 'avg',
          createdAt: 111,
          updatedAt: 222,
        },
      ],
      dataPoints: [{ id: 888, series: 'Weight', value: 71, timestamp: 5000 }],
    });

    const state = useDataStore.getState();
    expect(state.series).toHaveLength(1);
    const restored = state.series[0];
    expect(restored.name).toBe('Weight');
    expect(restored.color).toBe('#ff0000');
    expect(restored.emoji).toBe('⚖️');
    expect(restored.unit).toBe('kg');
    expect(restored.goal).toEqual({ target: 70, direction: 'at-most' });
    expect(restored.aggregation).toBe('avg');
    // ids/timestamps are regenerated locally, not copied verbatim from the backup
    expect(restored.id).not.toBe(999);
    expect(state.dataPoints).toEqual([{ id: expect.any(Number), series: 'Weight', value: 71, timestamp: 5000 }]);
  });

  it('merges into an existing series by name instead of duplicating it', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Weight', value: 70 });

    await useDataStore.getState().importBackup({
      version: 1,
      exportedAt: 1000,
      series: [
        { id: 999, name: 'weight', color: '#ff0000', type: 'numeric', createdAt: 111, updatedAt: 222 },
      ],
      dataPoints: [{ id: 888, series: 'weight', value: 71, timestamp: 5000 }],
    });

    const state = useDataStore.getState();
    expect(state.series).toHaveLength(1);
    expect(state.series[0].name).toBe('Weight');
    expect(state.dataPoints.map((p) => p.series)).toEqual(['Weight', 'Weight']);
  });
});

describe('importPoints', () => {
  it('batches points across new and existing series into a single state update', async () => {
    await useDataStore.getState().addDataPoint({ series: 'Existing', value: 1 });

    await useDataStore.getState().importPoints([
      { series: 'Existing', value: 2, timestamp: 2000 },
      { series: 'Brand New', value: 'hi', timestamp: 3000 },
    ]);

    const state = useDataStore.getState();
    expect(state.series.map((s) => s.name).sort()).toEqual(['Brand New', 'Existing']);
    expect(state.dataPoints).toHaveLength(3);
    expect(state.dataPoints.filter((p) => p.series === 'Existing')).toHaveLength(2);
  });
});
