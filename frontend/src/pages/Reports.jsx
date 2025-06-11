import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Doughnut, Line, Pie, Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  LineElement, 
  PointElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { 
  generatePDF, 
  exportToExcel, 
  exportToCSV, 
  exportToJSON,
  generateIndividualAssemblyReport,
  generateBatchReport 
} from '../utils/reportGenerator';
import { exportAssemblyData, getAssemblyLogs } from '../utils/assemblyUtils';
import { fetchWorkOrders } from '../api/workOrderApi';
import { fetchItemMaster } from '../api/itemMasterApi';
import { fetchAssemblyProcesses } from '../api/assemblyApi';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const Reports = () => {
  const [activeReport, setActiveReport] = useState('production');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    pcbType: 'all',
    status: 'all',
    department: 'all'
  });

  // Report types configuration
  const reportTypes = [
    {
      id: 'production',
      name: 'Production Report',
      icon: '📊',
      description: 'Assembly completion rates, production metrics, and performance analysis'
    },
    {
      id: 'quality',
      name: 'Quality Control',
      icon: '🔍',
      description: 'QA metrics, rejection rates, rework analysis, and quality trends'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      icon: '📦',
      description: 'Item master data, BOM components, and inventory analysis'
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      icon: '📋',
      description: 'User activity logs, assembly tracking, and compliance reports'
    },
    {
      id: 'assembly',
      name: 'Assembly Analytics',
      icon: '🔧',
      description: 'Detailed assembly performance, component tracking, and efficiency metrics'
    }
  ];

  // Fetch data when report type or filters change
  useEffect(() => {
    loadReportData();
  }, [activeReport, filters]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.relative')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [workOrders, items, assemblies] = await Promise.all([
        fetchWorkOrders(),
        fetchItemMaster(),
        fetchAssemblyProcesses()
      ]);

      // Get local storage data
      const completedOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
      const auditLogs = getAssemblyLogs();
      const assemblyExportData = exportAssemblyData();

      // Calculate report metrics based on active report type
      const data = calculateReportMetrics(activeReport, {
        workOrders: Array.isArray(workOrders) ? workOrders : [],
        items: Array.isArray(items) ? items : [],
        assemblies: Array.isArray(assemblies) ? assemblies : [],
        completedOrders,
        auditLogs,
        assemblyExportData
      });

      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      setReportData({});
    } finally {
      setLoading(false);
    }
  };

  const calculateReportMetrics = (reportType, data) => {
    const { workOrders, items, assemblies, completedOrders, auditLogs } = data;
    
    switch (reportType) {
      case 'production':
        return calculateProductionMetrics(workOrders, assemblies, completedOrders);
      case 'quality':
        return calculateQualityMetrics(workOrders, completedOrders, auditLogs);
      case 'inventory':
        return calculateInventoryMetrics(items, workOrders);
      case 'audit':
        return calculateAuditMetrics(auditLogs, workOrders);
      case 'assembly':
        return calculateAssemblyMetrics(assemblies, completedOrders, auditLogs);
      default:
        return {};
    }
  };

  const calculateProductionMetrics = (workOrders, assemblies, completedOrders) => {
    const total = workOrders.length;
    const completed = workOrders.filter(wo => wo.status === 'Completed').length;
    const pending = workOrders.filter(wo => wo.status === 'Pending').length;
    const inProgress = workOrders.filter(wo => wo.status === 'In Progress').length;

    // PCB Type distribution
    const pcbTypes = {};
    workOrders.forEach(wo => {
      const type = wo.pcb_type || (wo.item_code?.includes('5YB') ? 'YBS' : wo.item_code?.includes('5RS') ? 'RSM' : 'Other');
      pcbTypes[type] = (pcbTypes[type] || 0) + 1;
    });

    // Daily completion trend (last 7 days)
    const dailyCompletions = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyCompletions[dateStr] = 0;
    }

    completedOrders.forEach(order => {
      if (order.completedAt) {
        const dateStr = new Date(order.completedAt).toISOString().split('T')[0];
        if (dailyCompletions.hasOwnProperty(dateStr)) {
          dailyCompletions[dateStr]++;
        }
      }
    });

    return {
      summary: {
        totalWorkOrders: total,
        completedWorkOrders: completed,
        pendingWorkOrders: pending,
        inProgressWorkOrders: inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      charts: {
        statusDistribution: {
          labels: ['Completed', 'In Progress', 'Pending'],
          datasets: [{
            data: [completed, inProgress, pending],
            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
            borderWidth: 2
          }]
        },
        pcbTypeDistribution: {
          labels: Object.keys(pcbTypes),
          datasets: [{
            data: Object.values(pcbTypes),
            backgroundColor: ['#8b5cf6', '#06b6d4', '#f97316', '#84cc16'],
            borderWidth: 2
          }]
        },
        dailyCompletions: {
          labels: Object.keys(dailyCompletions),
          datasets: [{
            label: 'Completed Assemblies',
            data: Object.values(dailyCompletions),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }]
        }
      },
      details: workOrders.slice(0, 10) // Top 10 recent work orders
    };
  };

  const calculateQualityMetrics = (workOrders, completedOrders, auditLogs) => {
    const total = completedOrders.length;
    const reworked = completedOrders.filter(order => order.reworked).length;
    const qualityPassed = total - reworked;

    // Calculate defect rate by PCB type
    const defectsByType = {};
    const totalByType = {};
    
    completedOrders.forEach(order => {
      const type = order.pcb_type || 'Unknown';
      totalByType[type] = (totalByType[type] || 0) + 1;
      if (order.reworked) {
        defectsByType[type] = (defectsByType[type] || 0) + 1;
      }
    });

    // Quality trend over time
    const qualityTrend = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      qualityTrend[dateStr] = { passed: 0, failed: 0 };
    }

    completedOrders.forEach(order => {
      if (order.completedAt) {
        const dateStr = new Date(order.completedAt).toISOString().split('T')[0];
        if (qualityTrend[dateStr]) {
          if (order.reworked) {
            qualityTrend[dateStr].failed++;
          } else {
            qualityTrend[dateStr].passed++;
          }
        }
      }
    });

    return {
      summary: {
        totalAssemblies: total,
        qualityPassed: qualityPassed,
        reworkRequired: reworked,
        qualityRate: total > 0 ? Math.round((qualityPassed / total) * 100) : 100,
        defectRate: total > 0 ? Math.round((reworked / total) * 100) : 0
      },
      charts: {
        qualityDistribution: {
          labels: ['Quality Passed', 'Rework Required'],
          datasets: [{
            data: [qualityPassed, reworked],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 2
          }]
        },
        defectsByType: {
          labels: Object.keys(defectsByType),
          datasets: [{
            label: 'Defects',
            data: Object.values(defectsByType),
            backgroundColor: '#ef4444'
          }, {
            label: 'Total',
            data: Object.keys(defectsByType).map(type => totalByType[type]),
            backgroundColor: '#6b7280'
          }]
        },
        qualityTrend: {
          labels: Object.keys(qualityTrend),
          datasets: [{
            label: 'Quality Passed',
            data: Object.values(qualityTrend).map(day => day.passed),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)'
          }, {
            label: 'Rework Required',
            data: Object.values(qualityTrend).map(day => day.failed),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }]
        }
      },
      details: completedOrders.filter(order => order.reworked).slice(0, 10)
    };
  };

  const calculateInventoryMetrics = (items, workOrders) => {
    const totalItems = items.length;
    const ybsItems = items.filter(item => item.item_code?.includes('YB')).length;
    const rsmItems = items.filter(item => item.item_code?.includes('RS')).length;
    const bomItems = items.filter(item => item.item_code?.includes('BOM')).length;

    // Item categories
    const categories = {};
    items.forEach(item => {
      const category = item.product || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });

    // Most used items (from work orders)
    const itemUsage = {};
    workOrders.forEach(wo => {
      if (wo.item_code) {
        itemUsage[wo.item_code] = (itemUsage[wo.item_code] || 0) + 1;
      }
    });

    const topItems = Object.entries(itemUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ item_code: code, usage_count: count }));

    return {
      summary: {
        totalItems: totalItems,
        ybsItems: ybsItems,
        rsmItems: rsmItems,
        bomItems: bomItems,
        categories: Object.keys(categories).length
      },
      charts: {
        itemTypes: {
          labels: ['YBS Items', 'RSM Items', 'BOM Items', 'Others'],
          datasets: [{
            data: [ybsItems, rsmItems, bomItems, totalItems - ybsItems - rsmItems - bomItems],
            backgroundColor: ['#8b5cf6', '#06b6d4', '#f97316', '#6b7280'],
            borderWidth: 2
          }]
        },
        topCategories: {
          labels: Object.keys(categories).slice(0, 8),
          datasets: [{
            label: 'Items',
            data: Object.values(categories).slice(0, 8),
            backgroundColor: '#3b82f6'
          }]
        }
      },
      details: topItems
    };
  };

  const calculateAuditMetrics = (auditLogs, workOrders) => {
    const totalLogs = auditLogs.length;
    
    // Action types
    const actionTypes = {};
    auditLogs.forEach(log => {
      actionTypes[log.action] = (actionTypes[log.action] || 0) + 1;
    });

    // Daily activity
    const dailyActivity = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyActivity[dateStr] = 0;
    }

    auditLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      if (dailyActivity.hasOwnProperty(dateStr)) {
        dailyActivity[dateStr]++;
      }
    });

    return {
      summary: {
        totalLogs: totalLogs,
        uniqueActions: Object.keys(actionTypes).length,
        todayLogs: dailyActivity[new Date().toISOString().split('T')[0]] || 0,
        avgDailyLogs: Math.round(Object.values(dailyActivity).reduce((sum, count) => sum + count, 0) / 7)
      },
      charts: {
        actionTypes: {
          labels: Object.keys(actionTypes).slice(0, 8),
          datasets: [{
            data: Object.values(actionTypes).slice(0, 8),
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
              '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
            ],
            borderWidth: 2
          }]
        },
        dailyActivity: {
          labels: Object.keys(dailyActivity),
          datasets: [{
            label: 'Daily Activity',
            data: Object.values(dailyActivity),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        }
      },
      details: auditLogs.slice(0, 20)
    };
  };

  const calculateAssemblyMetrics = (assemblies, completedOrders, auditLogs) => {
    const totalAssemblies = assemblies.length;
    const completedAssemblies = assemblies.filter(a => a.status === 'completed').length;
    const inProgressAssemblies = assemblies.filter(a => a.status === 'in_progress').length;

    // Assembly efficiency (average time to complete)
    const completionTimes = completedOrders
      .filter(order => order.completion_metadata?.assemblyDuration)
      .map(order => order.completion_metadata.assemblyDuration / (1000 * 60)); // Convert to minutes

    const avgCompletionTime = completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
      : 0;

    // Component replacement rate
    const totalComponents = completedOrders.reduce((sum, order) => 
      sum + (order.scannedComponents?.length || 0), 0);
    const replacedComponents = completedOrders.reduce((sum, order) => 
      sum + (order.scannedComponents?.filter(comp => comp.replaced)?.length || 0), 0);

    return {
      summary: {
        totalAssemblies: totalAssemblies,
        completedAssemblies: completedAssemblies,
        inProgressAssemblies: inProgressAssemblies,
        avgCompletionTime: avgCompletionTime,
        componentReplacementRate: totalComponents > 0 ? Math.round((replacedComponents / totalComponents) * 100) : 0
      },
      charts: {
        assemblyStatus: {
          labels: ['Completed', 'In Progress', 'Pending'],
          datasets: [{
            data: [
              completedAssemblies, 
              inProgressAssemblies, 
              totalAssemblies - completedAssemblies - inProgressAssemblies
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#6b7280'],
            borderWidth: 2
          }]
        },
        completionTimes: {
          labels: ['< 30 min', '30-60 min', '60-120 min', '> 120 min'],
          datasets: [{
            data: [
              completionTimes.filter(t => t < 30).length,
              completionTimes.filter(t => t >= 30 && t < 60).length,
              completionTimes.filter(t => t >= 60 && t < 120).length,
              completionTimes.filter(t => t >= 120).length
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderWidth: 2
          }]
        }
      },
      details: completedOrders.slice(0, 10)
    };
  };

  const handleExportPDF = async () => {
    const data = {
      reportType: activeReport,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    };
    
    await generatePDF(data);
  };

  const handleExportExcel = () => {
    const data = {
      reportType: activeReport,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString()
    };
    
    exportToExcel(data, `${activeReport}_report`);
  };

  const handleExportCSV = () => {
    const { details } = reportData;
    if (details && details.length > 0) {
      exportToCSV(details, `${activeReport}_data`);
    }
  };

  const handleExportJSON = () => {
    const data = {
      reportType: activeReport,
      data: reportData,
      filters: filters,
      generatedAt: new Date().toISOString(),
      metadata: {
        version: '1.0',
        systemInfo: 'Assembly Management System',
        exportedBy: 'Current User'
      }
    };
    
    exportToJSON(data, `${activeReport}_report`);
  };

  const handleBatchReport = () => {
    const completedOrders = JSON.parse(localStorage.getItem('assemblyCompletedOrders') || '[]');
    const filteredOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.completed_at || order.completedAt);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (filteredOrders.length > 0) {
      generateBatchReport(filteredOrders, {
        start: filters.startDate,
        end: filters.endDate
      });
    } else {
      alert('No completed assemblies found for the selected date range.');
    }
  };

  const handleIndividualReport = (assemblyData) => {
    generateIndividualAssemblyReport(assemblyData);
  };

  // Enhanced date range presets
  const dateRangePresets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1, offset: 1 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This Month', custom: 'thisMonth' },
    { label: 'Last Month', custom: 'lastMonth' },
    { label: 'This Quarter', custom: 'thisQuarter' }
  ];

  const applyDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;

    if (preset.custom) {
      switch (preset.custom) {
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = today;
          break;
        case 'lastMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1);
          endDate = today;
          break;
        default:
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = today;
      }
    } else if (preset.offset) {
      // For "Yesterday"
      startDate = new Date(today.getTime() - preset.offset * 24 * 60 * 60 * 1000);
      endDate = new Date(today.getTime() - preset.offset * 24 * 60 * 60 * 1000);
    } else {
      // For regular day ranges
      startDate = preset.days === 0 ? today : new Date(today.getTime() - preset.days * 24 * 60 * 60 * 1000);
      endDate = today;
    }

    setFilters({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const renderChart = (chartData, type = 'bar') => {
    if (!chartData) return null;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };

    switch (type) {
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!reportData.summary) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for the selected filters.</p>
        </div>
      );
    }

    const { summary, charts, details } = reportData;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, value]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {key.includes('Rate') || key.includes('Percentage') ? '%' : ''}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(charts).map(([chartKey, chartData], index) => (
              <motion.div
                key={chartKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                  {chartKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h3>
                <div className="h-64">
                  {renderChart(
                    chartData, 
                    chartKey.includes('Distribution') ? 'doughnut' : 
                    chartKey.includes('Trend') || chartKey.includes('Daily') || chartKey.includes('Activity') ? 'line' : 
                    'bar'
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Details Table */}
        {details && details.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {Object.keys(details[0]).slice(0, 5).map(key => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {details.slice(0, 10).map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {Object.values(record).slice(0, 5).map((value, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {typeof value === 'string' && value.length > 50 
                            ? `${value.substring(0, 50)}...` 
                            : String(value)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive reporting for production, quality, and assembly metrics</p>
        </motion.div>

        {/* Report Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  activeReport === report.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{report.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {/* Date Range Presets */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Range:</span>
              {dateRangePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyDatePreset(preset)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PCB Type</label>
                <select
                  value={filters.pcbType}
                  onChange={(e) => setFilters({...filters, pcbType: e.target.value})}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="YBS">YBS</option>
                  <option value="RSM">RSM</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  More Options
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <div className="py-1">
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Export JSON
                      </button>
                      <button
                        onClick={handleBatchReport}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Batch Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={loadReportData}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;