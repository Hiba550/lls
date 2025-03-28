import React from 'react';

const WorkOrderTable = ({ workOrders }) => {
  return (
    <table className="min-w-full bg-white border border-gray-300">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b">Product</th>
          <th className="py-2 px-4 border-b">Item Code</th>
          <th className="py-2 px-4 border-b">Description</th>
          <th className="py-2 px-4 border-b">Quantity</th>
          <th className="py-2 px-4 border-b">Machine No</th>
          <th className="py-2 px-4 border-b">Customer Name</th>
          <th className="py-2 px-4 border-b">Target Date</th>
        </tr>
      </thead>
      <tbody>
        {workOrders.map((order) => (
          <tr key={order.item_code}>
            <td className="py-2 px-4 border-b">{order.product}</td>
            <td className="py-2 px-4 border-b">{order.item_code}</td>
            <td className="py-2 px-4 border-b">{order.description}</td>
            <td className="py-2 px-4 border-b">{order.quantity}</td>
            <td className="py-2 px-4 border-b">{order.machine_no}</td>
            <td className="py-2 px-4 border-b">{order.customer_name}</td>
            <td className="py-2 px-4 border-b">{order.target_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WorkOrderTable;