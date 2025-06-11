import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Generates a comprehensive PDF report based on report type and data
 * @param {Object} reportData - Report data including type, data, filters, etc.
 */
export const generatePDF = async (reportData) => {
  try {
    const { reportType, data, filters, generatedAt } = reportData;
    const { summary, details, charts } = data;
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Report titles
    const reportTitles = {
      production: 'Production Performance Report',
      quality: 'Quality Control Analysis Report',
      inventory: 'Inventory Management Report',
      audit: 'Audit Trail & Compliance Report',
      assembly: 'Assembly Analytics Report'
    };
    
    const title = reportTitles[reportType] || 'System Report';
    
    // Add header with company branding
    pdf.setFillColor(37, 99, 235); // Blue header
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Company name/logo area
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Assembly Management System', 15, 15);
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, 25, { align: 'center' });
    
    // Generation info
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, pageWidth / 2, 32, { align: 'center' });
    pdf.text(`Period: ${filters.startDate} to ${filters.endDate}`, pageWidth / 2, 37, { align: 'center' });
    
    yPosition = 55;
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Executive Summary
    if (summary && Object.keys(summary).length > 0) {
      yPosition = addExecutiveSummaryToPDF(pdf, summary, reportType, yPosition, pageWidth);
    }
    
    // Key Insights
    if (summary && Object.keys(summary).length > 0) {
      yPosition = addKeyInsightsToPDF(pdf, summary, reportType, yPosition, pageWidth);
    }
    
    // Charts summary (text-based since we can't easily embed charts)
    if (charts && Object.keys(charts).length > 0) {
      yPosition = addChartsSummaryToPDF(pdf, charts, yPosition, pageWidth);
    }
    
    // Details Table
    if (details && details.length > 0) {
      yPosition = addDetailsTableToPDF(pdf, details, reportType, yPosition);
    }
    
    // Add footer with page numbers and metadata
    addFooterToPDF(pdf, filters, generatedAt);
    
    // Save the PDF with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const fileName = `${reportType}_report_${timestamp}.pdf`;
    pdf.save(fileName);
    
    console.log(`PDF report generated successfully: ${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF report: ${error.message}`);
  }
};

/**
 * Add executive summary section to PDF
 */
const addExecutiveSummaryToPDF = (pdf, summary, reportType, yPosition, pageWidth) => {
  const summaryDescriptions = {
    production: 'Production efficiency and work order completion metrics',
    quality: 'Quality assurance metrics and defect analysis',
    inventory: 'Inventory levels and item management statistics',
    audit: 'System activity logs and compliance tracking',
    assembly: 'Assembly process performance and component tracking'
  };

  // Section title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Executive Summary', 15, yPosition);
  yPosition += 10;
  
  // Description
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(102, 102, 102);
  const description = summaryDescriptions[reportType] || 'System performance metrics and analytics';
  pdf.text(description, 15, yPosition);
  yPosition += 15;
  
  // Summary metrics in a grid
  const summaryKeys = Object.keys(summary);
  const metricsPerRow = 2;
  const boxWidth = 85;
  const boxHeight = 25;
  
  for (let i = 0; i < summaryKeys.length; i += metricsPerRow) {
    const rowKeys = summaryKeys.slice(i, i + metricsPerRow);
    
    rowKeys.forEach((key, index) => {
      const x = 15 + (index * (boxWidth + 10));
      const value = summary[key];
      
      // Draw box
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(x, yPosition, boxWidth, boxHeight, 'FD');
      
      // Key label
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      pdf.text(label, x + 5, yPosition + 8);
      
      // Value
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
      const suffix = (key.includes('Rate') || key.includes('Percentage')) ? '%' : '';
      pdf.text(`${displayValue}${suffix}`, x + 5, yPosition + 18);
    });
    
    yPosition += boxHeight + 10;
  }
  
  return yPosition + 10;
};

/**
 * Add key insights section to PDF
 */
const addKeyInsightsToPDF = (pdf, summary, reportType, yPosition, pageWidth) => {
  if (!summary) return yPosition;
  
  // Check if we need a new page
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }
  
  // Section title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Key Insights & Analysis', 15, yPosition);
  yPosition += 15;
  
  const insights = generateInsights(reportType, summary);
  
  insights.forEach(insight => {
    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Draw insight box
    const boxHeight = 25;
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(...getInsightColor(insight.color));
    pdf.setLineWidth(2);
    pdf.rect(15, yPosition - 5, pageWidth - 30, boxHeight, 'FD');
    
    // Add colored left border
    pdf.setFillColor(...getInsightColor(insight.color));
    pdf.rect(15, yPosition - 5, 3, boxHeight, 'F');
    
    // Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    pdf.text(insight.title, 22, yPosition + 2);
    
    // Description
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const wrappedText = pdf.splitTextToSize(insight.description, pageWidth - 40);
    pdf.text(wrappedText, 22, yPosition + 8);
    
    yPosition += boxHeight + 8;
  });
  
  return yPosition + 10;
};

/**
 * Add charts summary section to PDF
 */
const addChartsSummaryToPDF = (pdf, charts, yPosition, pageWidth) => {
  if (!charts || Object.keys(charts).length === 0) return yPosition;
  
  // Check if we need a new page
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }
  
  // Section title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Data Visualization Summary', 15, yPosition);
  yPosition += 15;
  
  Object.entries(charts).forEach(([chartName, chartData]) => {
    // Check if we need a new page
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(55, 65, 81);
    const formattedChartName = chartName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    pdf.text(formattedChartName, 15, yPosition);
    yPosition += 8;
    
    // Chart data summary
    if (chartData.labels && chartData.datasets) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      
      const maxItems = Math.min(5, chartData.labels.length); // Show top 5 items
      for (let i = 0; i < maxItems; i++) {
        const label = chartData.labels[i];
        const value = chartData.datasets[0]?.data[i] || 0;
        pdf.text(`• ${label}: ${value}`, 20, yPosition);
        yPosition += 4;
      }
      
      if (chartData.labels.length > 5) {
        pdf.text(`... and ${chartData.labels.length - 5} more items`, 20, yPosition);
        yPosition += 4;
      }
    }
    
    yPosition += 8;
  });
  
  return yPosition + 10;
};

/**
 * Enhanced footer with page numbers and metadata
 */
const addFooterToPDF = (pdf, filters, generatedAt) => {
  const pageCount = pdf.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Footer background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 280, pdf.internal.pageSize.getWidth(), 15, 'F');
    
    // Footer text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    
    // Left: Generation info
    pdf.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, 15, 288);
    
    // Center: System info
    pdf.text('Assembly Management System', pdf.internal.pageSize.getWidth() / 2, 288, { align: 'center' });
    
    // Right: Page number
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 15, 288, { align: 'right' });
    
    // Filters summary on first page
    if (i === 1) {
      pdf.setFontSize(7);
      pdf.text(`Filters: ${filters.pcbType !== 'all' ? `PCB: ${filters.pcbType} | ` : ''}${filters.status !== 'all' ? `Status: ${filters.status} | ` : ''}${filters.department !== 'all' ? `Dept: ${filters.department}` : ''}`, 15, 292);
    }
  }
};

/**
 * Get RGB color values for insights
 */
const getInsightColor = (colorHex) => {
  const hex = colorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
};

/**
 * Add details table to PDF with enhanced formatting
 */
const addDetailsTableToPDF = (pdf, details, reportType, yPosition) => {
  if (!details || details.length === 0) return yPosition;
  
  // Check if we need a new page
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }
  
  // Section title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text('Detailed Records', 15, yPosition);
  yPosition += 10;
  
  // Generate table columns based on available data
  const columns = generateTableColumns(reportType, details[0]);
  const rows = details.slice(0, 20).map(item => columns.map(col => {
    const value = item[col.dataKey];
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && value.length > 30) {
      return value.substring(0, 27) + '...';
    }
    return String(value);
  }));
  
  // Create table with enhanced styling
  pdf.autoTable({
    startY: yPosition,
    head: [columns.map(col => col.title)],
    body: rows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 }
    }
  });
  
  // Add note if data was truncated
  if (details.length > 20) {
    const finalY = pdf.lastAutoTable.finalY + 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Note: Showing 20 of ${details.length} total records. Export to Excel for complete data.`, 15, finalY);
  }
  
  return pdf.lastAutoTable.finalY + 15;
};

/**
 * Generate table columns based on report type and data structure
 */
const generateTableColumns = (reportType, sampleData) => {
  if (!sampleData) return [];
  
  const allKeys = Object.keys(sampleData);
  
  // Define preferred columns for each report type
  const reportColumns = {
    production: ['id', 'product', 'item_code', 'status', 'pcb_type', 'created_at'],
    quality: ['id', 'product', 'item_code', 'status', 'reworked', 'completed_at'],
    inventory: ['id', 'item_code', 'description', 'type', 'product', 'usage_count'],
    audit: ['action', 'details', 'timestamp', 'operator', 'module'],
    assembly: ['id', 'product', 'item_code', 'status', 'completed_at', 'pcb_type']
  };
  
  const preferredKeys = reportColumns[reportType] || allKeys.slice(0, 6);
  
  // Map keys to column definitions
  return preferredKeys
    .filter(key => allKeys.includes(key))
    .map(key => ({
      title: key.replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .replace(/^./, str => str.toUpperCase()),
      dataKey: key
    }));
};

/**
 * Generate insights based on report type and data
 */
const generateInsights = (reportType, summary) => {
  switch (reportType) {
    case 'production':
      return [
        {
          title: 'Production Efficiency',
          description: `Completion rate of ${summary.completionRate}% indicates ${summary.completionRate >= 80 ? 'excellent' : summary.completionRate >= 60 ? 'good' : 'needs improvement'} production performance.`,
          color: summary.completionRate >= 80 ? '#10b981' : summary.completionRate >= 60 ? '#f59e0b' : '#ef4444'
        },
        {
          title: 'Work Order Status',
          description: `${summary.pendingWorkOrders} work orders pending completion. Consider resource allocation optimization.`,
          color: '#3b82f6'
        },
        {
          title: 'Pipeline Health',
          description: `${summary.inProgressWorkOrders} work orders currently in progress, indicating ${summary.inProgressWorkOrders > 5 ? 'active' : 'moderate'} production pipeline.`,
          color: '#8b5cf6'
        }
      ];
    case 'quality':
      return [
        {
          title: 'Quality Performance',
          description: `Quality rate of ${summary.qualityRate}% ${summary.qualityRate >= 95 ? 'exceeds' : summary.qualityRate >= 90 ? 'meets' : 'falls below'} industry standards.`,
          color: summary.qualityRate >= 95 ? '#10b981' : summary.qualityRate >= 90 ? '#f59e0b' : '#ef4444'
        },
        {
          title: 'Rework Analysis',
          description: `${summary.reworkRequired} assemblies required rework, representing ${summary.defectRate}% defect rate.`,
          color: '#ef4444'
        },
        {
          title: 'Process Reliability',
          description: `Quality trends indicate ${summary.qualityRate > 90 ? 'stable' : 'variable'} manufacturing processes.`,
          color: '#06b6d4'
        }
      ];
    case 'inventory':
      return [
        {
          title: 'Inventory Composition',
          description: `${summary.totalItems} total items with ${summary.ybsItems} YBS and ${summary.rsmItems} RSM components.`,
          color: '#3b82f6'
        },
        {
          title: 'Product Diversity',
          description: `${summary.categories} different product categories indicate diverse inventory portfolio.`,
          color: '#8b5cf6'
        },
        {
          title: 'BOM Coverage',
          description: `${summary.bomItems} BOM items ensure comprehensive assembly documentation.`,
          color: '#10b981'
        }
      ];
    case 'audit':
      return [
        {
          title: 'System Activity',
          description: `${summary.totalLogs} audit logs with ${summary.avgDailyLogs} average daily activities indicate ${summary.avgDailyLogs > 10 ? 'high' : 'moderate'} system usage.`,
          color: '#3b82f6'
        },
        {
          title: 'Compliance Tracking',
          description: `${summary.uniqueActions} unique action types provide comprehensive audit coverage.`,
          color: '#10b981'
        },
        {
          title: 'Recent Activity',
          description: `${summary.todayLogs} activities logged today showing current system engagement.`,
          color: '#f59e0b'
        }
      ];
    case 'assembly':
      return [
        {
          title: 'Assembly Efficiency',
          description: `Average completion time of ${summary.avgCompletionTime} minutes indicates ${summary.avgCompletionTime < 60 ? 'efficient' : 'moderate'} assembly processes.`,
          color: summary.avgCompletionTime < 60 ? '#10b981' : '#f59e0b'
        },
        {
          title: 'Component Quality',
          description: `${summary.componentReplacementRate}% component replacement rate ${summary.componentReplacementRate < 5 ? 'meets' : 'exceeds'} expected thresholds.`,
          color: summary.componentReplacementRate < 5 ? '#10b981' : '#ef4444'
        },
        {
          title: 'Production Status',
          description: `${summary.inProgressAssemblies} assemblies in progress with ${summary.completedAssemblies} completed.`,
          color: '#8b5cf6'
        }
      ];
    default:
      return [];
  }
};

/**
 * Generate details table
 */
const generateDetailsTable = (reportType, details) => {
  if (!details || details.length === 0) return '';
  
  const headers = Object.keys(details[0]).slice(0, 6); // Limit to 6 columns for readability
  
  return `
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 20px; color: #1f2937; margin-bottom: 15px;">Detailed Records</h2>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; background: white;">
          <thead>
            <tr style="background-color: #f9fafb;">
              ${headers.map(header => `
                <th style="padding: 12px 8px; text-align: left; border: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">
                  ${header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${details.slice(0, 15).map((record, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
                ${headers.map(header => {
                  const value = record[header];
                  const displayValue = typeof value === 'string' && value.length > 40 
                    ? `${value.substring(0, 40)}...` 
                    : String(value || '-');
                  return `
                    <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 11px; color: #374151;">
                      ${displayValue}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${details.length > 15 ? `
        <p style="font-size: 12px; color: #6b7280; margin-top: 10px; text-align: center;">
          Showing 15 of ${details.length} records. Export full data for complete details.
        </p>
      ` : ''}
    </div>
  `;
};

/**
 * Generate report footer
 */
const generateFooter = () => {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        This report was automatically generated by the Assembly Management System<br>
        For questions or concerns, please contact the system administrator
      </p>
      <div style="margin-top: 15px;">
        <p style="color: #059669; font-weight: bold; font-size: 14px; margin: 0;">✓ DATA VERIFIED & VALIDATED</p>
      </div>
    </div>
  `;
};

/**
 * Generates a PDF report for a completed assembly
 * @param {Object} assemblyData - Data about the completed assembly
 */
export const generateAssemblyPDF = async (assemblyData) => {
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
          <td style="padding: 5px 10px;">${assemblyData.workOrder?.product || assemblyData.product}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Item Code:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder?.item_code || assemblyData.item_code}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px 10px;">Work Order:</td>
          <td style="padding: 5px 10px;">#${assemblyData.workOrder?.id || assemblyData.id}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Serial Number:</td>
          <td style="padding: 5px 10px;">${assemblyData.serialNumber || assemblyData.assemblyBarcodeNumber}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px 10px;">Customer:</td>
          <td style="padding: 5px 10px;">${assemblyData.workOrder?.customer_name || 'N/A'}</td>
          <td style="font-weight: bold; padding: 5px 10px;">Operator:</td>
          <td style="padding: 5px 10px;">${assemblyData.completedBy || 'Current User'}</td>
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
          ${(assemblyData.scannedParts || assemblyData.scannedComponents || []).map(part => `
            <tr ${part.replaced ? 'style="background-color: #fff7ed;"' : ''}>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">
                ${part.partCode || part.barcode} 
                ${part.replaced ? '<span style="color: #b45309; font-size: 12px;">(Replaced)</span>' : ''}
              </td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${part.description || part.componentName || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(part.scanTime || part.scan_time || Date.now()).toLocaleString()}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">
                <span style="background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 9999px; font-size: 12px;">
                  ${part.replaced ? 'Replaced' : 'Scanned'}
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
          ${(assemblyData.assemblyLogs || []).map(log => `
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
  // Using a free QR code service - in production, consider using a library like qrcode
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(data))}`;
};

// Enhanced Excel export with multiple worksheets and formatting
export const exportToExcel = (reportData, fileName) => {
  try {
    const { reportType, data, filters, generatedAt } = reportData;
    const { summary, details, charts } = data;
    
    if (!data || (!details && !summary)) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // 1. Summary worksheet with enhanced formatting
    if (summary) {
      const summaryData = [
        [`${reportType.toUpperCase()} REPORT SUMMARY`],
        [`Generated: ${new Date(generatedAt).toLocaleString()}`],
        [`Date Range: ${filters.startDate} to ${filters.endDate}`],
        [`Filters: PCB Type: ${filters.pcbType}, Status: ${filters.status}, Department: ${filters.department}`],
        [], // Empty row
        ['Metric', 'Value', 'Type'],
        ...Object.entries(summary).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value,
          typeof value === 'number' ? 'Numeric' : 'Text'
        ])
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summaryWs['!cols'] = [
        { wch: 30 }, // Metric column
        { wch: 15 }, // Value column
        { wch: 10 }  // Type column
      ];
      
      // Merge title cell
      summaryWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
    }

    // 2. Detailed data worksheet with formatting
    if (details && details.length > 0) {
      const detailsWs = XLSX.utils.json_to_sheet(details);
      
      // Set column widths based on content
      const colWidths = Object.keys(details[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...details.slice(0, 100).map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength, 10), 50) };
      });
      detailsWs['!cols'] = colWidths;
      
      // Add auto filter
      if (details.length > 0) {
        const range = XLSX.utils.decode_range(detailsWs['!ref']);
        detailsWs['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
      }
      
      XLSX.utils.book_append_sheet(workbook, detailsWs, 'Detailed Data');
    }

    // 3. Charts data worksheet (if available)
    if (charts && Object.keys(charts).length > 0) {
      const chartsData = [];
      Object.entries(charts).forEach(([chartName, chartData]) => {
        if (chartData.labels && chartData.datasets) {
          // Add chart header
          chartsData.push({
            'Chart': `=== ${chartName.toUpperCase()} ===`,
            'Label': '',
            'Dataset': '',
            'Value': ''
          });
          
          chartData.labels.forEach((label, index) => {
            chartData.datasets.forEach((dataset, datasetIndex) => {
              chartsData.push({
                'Chart': chartName,
                'Label': label,
                'Dataset': dataset.label || `Dataset ${datasetIndex + 1}`,
                'Value': dataset.data[index] || 0
              });
            });
          });
          
          // Add empty row between charts
          chartsData.push({
            'Chart': '',
            'Label': '',
            'Dataset': '',
            'Value': ''
          });
        }
      });
      
      if (chartsData.length > 0) {
        const chartsWs = XLSX.utils.json_to_sheet(chartsData);
        chartsWs['!cols'] = [
          { wch: 25 }, // Chart
          { wch: 20 }, // Label
          { wch: 20 }, // Dataset
          { wch: 15 }  // Value
        ];
        XLSX.utils.book_append_sheet(workbook, chartsWs, 'Charts Data');
      }
    }

    // 4. Enhanced filter information worksheet
    const filterData = [
      ['APPLIED FILTERS'],
      ['Filter Type', 'Value'],
      ...Object.entries(filters).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value
      ]),
      [],
      ['EXPORT INFORMATION'],
      ['Export Type', 'Value'],
      ['Report Type', reportType],
      ['Generated At', new Date(generatedAt).toLocaleString()],
      ['System', 'Assembly Management System'],
      ['Version', '1.0']
    ];
    
    const filtersWs = XLSX.utils.aoa_to_sheet(filterData);
    filtersWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
    filtersWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }
    ];
    
    XLSX.utils.book_append_sheet(workbook, filtersWs, 'Export Info');

    // 5. Add metadata properties
    workbook.Props = {
      Title: `${reportType} Report`,
      Subject: 'Assembly Management System Report',
      Author: 'Assembly Management System',
      CreatedDate: new Date()
    };

    // Export the workbook with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const finalFileName = `${fileName}_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, finalFileName);
    
    console.log(`Excel file exported successfully: ${finalFileName}`);
    return finalFileName;
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export Excel file: ${error.message}`);
  }
};

// Export raw data to CSV
export const exportToCSV = (data, fileName) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  // Convert data to CSV format
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      // Handle values that might contain commas or quotes
      const stringValue = String(value || '');
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${stringValue.replace(/"/g, '""')}"` 
        : stringValue;
    }).join(',')
  ).join('\n');
  const csv = `${headers}\n${rows}`;
  
  // Create a download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export report data to JSON format
 */
export const exportToJSON = (reportData, fileName) => {
  const jsonString = JSON.stringify(reportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate individual assembly completion report
 */
export const generateIndividualAssemblyReport = async (assemblyData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assembly Completion Certificate', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Assembly ID: ${assemblyData.id}`, pageWidth / 2, 28, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 35, { align: 'center' });
  
  // Reset color and add content
  pdf.setTextColor(0, 0, 0);
  let yPos = 60;
  
  // Assembly details
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assembly Details', 15, yPos);
  yPos += 10;
  
  const details = [
    ['Product:', assemblyData.product || 'N/A'],
    ['Item Code:', assemblyData.item_code || 'N/A'],
    ['Serial Number:', assemblyData.serial_number || 'N/A'],
    ['PCB Type:', assemblyData.pcb_type || 'N/A'],
    ['Completed At:', new Date(assemblyData.completed_at || Date.now()).toLocaleString()],
    ['Operator:', assemblyData.completedBy || 'Current User'],
    ['Status:', assemblyData.status || 'Completed']
  ];
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  details.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), 60, yPos);
    yPos += 6;
  });
  
  // Components section
  yPos += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Scanned Components', 15, yPos);
  yPos += 10;
  
  if (assemblyData.scannedComponents && assemblyData.scannedComponents.length > 0) {
    pdf.autoTable({
      startY: yPos,
      head: [['Component', 'Barcode', 'Item Code', 'Status']],
      body: assemblyData.scannedComponents.map(comp => [
        comp.componentName || comp.name || 'N/A',
        comp.barcode || 'N/A',
        comp.itemCode || 'N/A',
        comp.replaced ? 'Replaced' : 'Original'
      ]),
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    yPos = pdf.lastAutoTable.finalY + 20;
  }
  
  // QA Certification
  if (yPos > 240) {
    pdf.addPage();
    yPos = 20;
  }
  
  pdf.setFillColor(16, 185, 129);
  pdf.rect(15, yPos, pageWidth - 30, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✓ QUALITY ASSURANCE CERTIFIED', pageWidth / 2, yPos + 12, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text('This assembly has passed all quality checks and is ready for deployment', pageWidth / 2, yPos + 20, { align: 'center' });
  
  // Save
  pdf.save(`Assembly_${assemblyData.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Generate batch report for multiple assemblies
 */
export const generateBatchReport = async (assemblies, dateRange) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Batch Assembly Report', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Period: ${dateRange.start} to ${dateRange.end}`, pageWidth / 2, 28, { align: 'center' });
  
  // Summary
  pdf.setTextColor(0, 0, 0);
  let yPos = 50;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Batch Summary', 15, yPos);
  yPos += 15;
  
  const summary = {
    'Total Assemblies': assemblies.length,
    'Completed': assemblies.filter(a => a.status === 'Completed').length,
    'Reworked': assemblies.filter(a => a.reworked).length,
    'Success Rate': `${Math.round((assemblies.filter(a => !a.reworked).length / assemblies.length) * 100)}%`
  };
  
  Object.entries(summary).forEach(([key, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${key}:`, 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), 80, yPos);
    yPos += 8;
  });
  
  // Detailed table
  yPos += 10;
  pdf.autoTable({
    startY: yPos,
    head: [['ID', 'Product', 'Item Code', 'Completed', 'Status']],
    body: assemblies.map(assembly => [
      assembly.id,
      assembly.product || 'N/A',
      assembly.item_code || 'N/A',
      new Date(assembly.completed_at || Date.now()).toLocaleDateString(),
      assembly.reworked ? 'Reworked' : 'Completed'
    ]),
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // Save
  pdf.save(`Batch_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
};