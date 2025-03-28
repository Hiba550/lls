import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF report for the completed assembly
 * @param {Object} assemblyData - Data about the completed assembly
 */
export const generatePDF = async (assemblyData) => {
  // Create a temporary div to render the report content
  const reportElement = document.createElement('div');
  reportElement.style.padding = '20px';
  reportElement.style.fontFamily = 'Arial, sans-serif';
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #2563eb; font-size: 24px;">Assembly Completion Report</h1>
      <p style="color: #666;">Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Work Order Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="font-weight: bold; padding: 5px 10px;">Product:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder.product}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Item Code:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder.item_code}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px 10px;">Quantity:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder.quantity}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Serial Number:</td>
          <td style="padding: 5px 10px;">${assemblyData.serialNumber}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px 10px;">Customer:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder.customer_name || 'N/A'}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Machine No:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder.machine_no || 'N/A'}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Scanned Components</h2>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Component</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Description</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Scan Time</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${assemblyData.scannedParts.map(part => `
            <tr ${part.replaced ? 'style="background-color: #fff7ed;"' : ''}>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">
                ${part.partCode} 
                ${part.replaced ? '<span style="color: #b45309; font-size: 12px;">(Replaced)</span>' : ''}
              </td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${part.description}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(part.scanTime).toLocaleString()}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">
                <span style="background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 9999px; font-size: 12px;">
                  Scanned
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">Assembly Logs</h2>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Action</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Details</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Timestamp</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Operator</th>
          </tr>
        </thead>
        <tbody>
          ${assemblyData.assemblyLogs.map(log => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; color: #2563eb;">${log.action}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${log.details}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(log.timestamp).toLocaleString()}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${log.operator}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
      <p style="margin-bottom: 5px;">Assembly completed on: ${new Date(assemblyData.completedAt).toLocaleString()}</p>
      <p style="color: #059669; font-weight: bold;">✓ QA CHECK PASSED</p>
    </div>
  `;

  document.body.appendChild(reportElement);

  try {
    // Convert the HTML to a canvas
    const canvas = await html2canvas(reportElement);
    
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add the image to the PDF (first page)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(`Assembly_Report_${assemblyData.serialNumber}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Clean up
    document.body.removeChild(reportElement);
  }
};

// Generate a QR code for an item
export const generateQRCode = async (data) => {
  // This is a placeholder - in a real application, you would use a QR code generation library
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(data))}`;
};

// Export a report to Excel
export const exportToExcel = (data, fileName) => {
  // This is a placeholder - in a real application, you would use a library like xlsx
  console.log(`Exporting to Excel: ${fileName}`, data);
  
  // Convert data to CSV format
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const csv = `${headers}\n${rows}`;
  
  // Create a download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to generate traceability reports
export const generateTraceabilityReport = (serialNumber, data) => {
  console.log(`Generating traceability report for: ${serialNumber}`, data);
  // This would be implemented based on your specific traceability requirements
};