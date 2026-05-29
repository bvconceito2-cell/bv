
import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  ExternalLink,
  Tag,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
}


export const DataTable = ({ 
  columns, 
  data, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  actions,
  selectedIds,
  onSelectRow,
  onSelectAll
}: DataTableProps) => {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-50 flex items-center px-6 gap-4">
              <div className="h-10 w-10 bg-gray-100 rounded"></div>
              <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/6"></div>
              <div className="h-4 bg-gray-100 rounded w-1/6 ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {onSelectAll && (
                <th className="px-6 py-4 w-10">
                  <button onClick={onSelectAll} className="text-gray-300 hover:text-brand-primary">
                    {data.length > 0 && selectedIds?.length === data.length ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
              )}

              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || onView || actions) && (
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                  {onSelectRow && (
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); onSelectRow(row.id); }}>
                      <button className="text-gray-300 hover:text-brand-primary">
                        {selectedIds?.includes(row.id) ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                  )}

                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-600">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView || actions) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button onClick={() => onView(row)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {actions && actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500 italic">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const StatusBadge = ({ status, variant = 'default' }: { status: string; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${variants[variant]}`}>
      {status}
    </span>
  );
};
