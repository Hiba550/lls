import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  striped = false,
  hover = true,
  compact = false,
  headerClass = '',
  rowClass = '',
  cellClass = '',
}) => {
  const { darkMode } = useTheme();
  
  const baseTableClass = `min-w-full divide-y divide-gray-200 ${darkMode ? 'dark:divide-gray-700' : ''}`;
  const baseHeaderClass = `bg-gray-50 ${darkMode ? 'dark:bg-gray-800' : ''} ${headerClass}`;
  const headerCellClass = `px-6 py-3 text-left text-xs font-medium text-gray-500 ${darkMode ? 'dark:text-gray-400' : ''} uppercase tracking-wider`;
  
  const baseRowClass = `${hover ? 'hover:bg-gray-50 ' : ''}${darkMode ? 'hover:bg-gray-800' : ''} ${rowClass} ${onRowClick ? 'cursor-pointer' : ''}`;
  const stripedRowClass = striped ? 'even:bg-gray-50 even:dark:bg-gray-800' : '';
  const baseCellClass = `px-6 py-${compact ? '2' : '4'} whitespace-nowrap text-sm text-gray-500 ${darkMode ? 'dark:text-gray-400' : ''} ${cellClass}`;
  
  const renderedColumns = columns.map((column, index) => (
    <th 
      key={index} 
      scope="col" 
      className={`${headerCellClass} ${column.headerClassName || ''}`}
      style={column.width ? { width: column.width } : {}}
    >
      {column.header}
    </th>
  ));
  
  const renderedRows = isLoading ? (
    <tr>
      <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      </td>
    </tr>
  ) : data.length === 0 ? (
    <tr>
      <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </td>
    </tr>
  ) : data.map((row, rowIndex) => (
    <tr 
      key={rowIndex} 
      onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
      className={`${baseRowClass} ${stripedRowClass}`}
    >
      {columns.map((column, colIndex) => (
        <td 
          key={colIndex} 
          className={`${baseCellClass} ${column.cellClassName || ''}`}
        >
          {column.render ? column.render(row, rowIndex) : row[column.field]}
        </td>
      ))}
    </tr>
  ));

  return (
    <div className={`overflow-x-auto rounded-lg shadow ${className}`}>
      <table className={baseTableClass}>
        <thead className={baseHeaderClass}>
          <tr>
            {renderedColumns}
          </tr>
        </thead>
        <tbody className={`bg-white ${darkMode ? 'dark:bg-gray-900' : ''} divide-y divide-gray-200 ${darkMode ? 'dark:divide-gray-700' : ''}`}>
          {renderedRows}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string,
      header: PropTypes.node,
      render: PropTypes.func,
      width: PropTypes.string,
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  isLoading: PropTypes.bool,
  emptyMessage: PropTypes.node,
  className: PropTypes.string,
  striped: PropTypes.bool,
  hover: PropTypes.bool,
  compact: PropTypes.bool,
  headerClass: PropTypes.string,
  rowClass: PropTypes.string,
  cellClass: PropTypes.string
};

export default Table;