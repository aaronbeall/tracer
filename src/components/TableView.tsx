import { useState } from 'react';
import type { DataPoint } from '@/services/db';
import { Button } from '@/components/ui/button';
import { Trash, ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { createColumnHelper, useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';

interface TableViewProps {
  dataPoints: DataPoint[];
  onEdit: (id: number, updatedData: Partial<DataPoint>) => void;
  onDelete: (id: number) => void;
  availableSeries: string[];
}

const TableView: React.FC<TableViewProps> = ({ dataPoints, onEdit, onDelete, availableSeries }) => {
  const [rowToDelete, setRowToDelete] = useState<DataPoint | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);

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
        <Dialog open={!!rowToDelete} onOpenChange={(isOpen) => !isOpen && setRowToDelete(null)}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => setRowToDelete(info.row.original)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <p>Are you sure you want to delete this row?</p>
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    }),
  ];

  const table = useReactTable({
    data: dataPoints,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
    </div>
  );
};

export default TableView;
