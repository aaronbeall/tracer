import React, { memo, useState } from 'react';
import type { DataPoint, DataSeries } from '@/services/db';
import { Button } from '@/components/ui/button';
import { Trash, ChevronUp, ChevronDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { createColumnHelper, useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel } from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { useSeriesByName } from '@/store/dataStore';

interface TableViewProps {
  dataPoints: DataPoint[];
  onEdit: (id: number, updatedData: Partial<DataPoint>) => void;
  onDelete: (id: number) => void;
  series: DataSeries[];
}

const TableView: React.FC<TableViewProps> = memo(({ dataPoints, onEdit, onDelete, series }) => {
  const availableSeries = series.map((s) => s.name);
  const seriesByName = useSeriesByName();
  const [rowToDelete, setRowToDelete] = useState<DataPoint | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const pageCount = Math.ceil(dataPoints.length / pagination.pageSize);

  const columnHelper = createColumnHelper<DataPoint>();

  const handleCellEdit = async (rowIndex: number, columnId: string, value: string | number | null) => {
    if (!(columnId in dataPoints[rowIndex])) return;

    const currentValue = dataPoints[rowIndex][columnId as keyof DataPoint];
    if (currentValue == value) return;

    const updatedValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;

    const updatedData: Partial<DataPoint> = { [columnId]: updatedValue };

    const id = dataPoints[rowIndex].id;
    onEdit(id, updatedData);
  };

  const handleDelete = (id: number | undefined) => {
    if (id !== undefined) {
      onDelete(id);
    }
    setRowToDelete(null);
  };

  const columns = [
    columnHelper.accessor('timestamp', {
      header: 'Date',
      cell: (info) => (
        <input
          type="datetime-local"
          defaultValue={new Date(info.getValue()).toISOString().slice(0, 16)}
          onBlur={(e) => {
            const newTimestamp = new Date(e.target.value).getTime();
            handleCellEdit(info.row.index, info.column.id, newTimestamp);
          }}
        />
      ),
    }),
    columnHelper.accessor('series', {
      header: 'Series',
      cell: (info) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: seriesByName[info.getValue()]?.color || 'gray',
            }}
          ></span>
          <>
            <datalist id={`series-${info.row.index}`}>
              {availableSeries.map((series) => (
                <option key={series} value={series} />
              ))}
            </datalist>
            <input
              type="text"
              list={`series-${info.row.index}`}
              defaultValue={info.getValue()}
              onBlur={(e) => handleCellEdit(info.row.index, info.column.id, e.target.value)}
            />
          </>
        </div>
      ),
    }),
    columnHelper.accessor('value', {
      header: 'Value',
      cell: (info) => {
        const value = info.getValue();
        const isNumber = typeof value === 'number';
        return (
          <input
            type={isNumber ? 'number' : 'text'}
            defaultValue={value}
            onBlur={(e) => handleCellEdit(info.row.index, info.column.id, isNumber ? Number(e.target.value) : e.target.value)}
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => setRowToDelete(info.row.original)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Are you sure you want to delete this row?</p>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="secondary"
                onClick={() => setRowToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(rowToDelete?.id)}
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ),
    }),
  ];

  const table = useReactTable({
    data: dataPoints,
    columns,
    state: { sorting, pagination },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  // Add a page size selector
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="table-container overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {typeof header.column.columnDef.header === 'function'
                    ? header.column.columnDef.header(header.getContext())
                    : header.column.columnDef.header}
                  {header.column.getIsSorted() === 'asc' && <ChevronUp className="inline w-4 h-4 ml-1" />}
                  {header.column.getIsSorted() === 'desc' && <ChevronDown className="inline w-4 h-4 ml-1" />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  {typeof cell.column.columnDef.cell === 'function'
                    ? cell.column.columnDef.cell(cell.getContext())
                    : cell.column.columnDef.cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-2 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page:</span>
          <select
            className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={pagination.pageSize}
            onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto">
          <span className="text-xs text-gray-500 mr-4">
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TableView;
