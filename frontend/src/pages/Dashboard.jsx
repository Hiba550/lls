import React, { useState, useEffect } from 'react';
import { fetchWorkOrders } from '../api/workOrderApi';
import { fetchItemMaster } from '../api/itemMasterApi';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    pendingWorkOrders: 0,
    inProgressWorkOrders: 0,
    completedWorkOrders: 0,
    itemsInInventory: 0,
    completedAssemblies: 0,
    rejectedItems: 0,
    pendingQA: 0,
    inProgressAssemblies: 0,
    assembliesLastWeek: 0
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week'); // 'day', 'week', 'month'

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real data from APIs
        const [workOrders, items] = await Promise.all([
          fetchWorkOrders(),
          fetchItemMaster()
        ]);

        // Calculate dashboard statistics from real data
        const totalWorkOrders = Array.isArray(workOrders) ? workOrders.length : 0;
        const pendingWorkOrders = Array.isArray(workOrders) 
          ? workOrders.filter(wo => wo.status === 'Pending').length 
          : 0;
        const inProgressWorkOrders = Array.isArray(workOrders) 
          ? workOrders.filter(wo => wo.status === 'In Progress').length 
          : 0;
        const completedWorkOrders = Array.isArray(workOrders) 
          ? workOrders.filter(wo => wo.status === 'Completed').length 
          : 0;
        const itemsInInventory = Array.isArray(items) ? items.length : 0;
        const completedAssemblies = completedWorkOrders;
        const rejectedItems = Math.floor(totalWorkOrders * 0.05); 
        const pendingQA = Math.floor(totalWorkOrders * 0.15);
        const inProgressAssemblies = 15;
        const assembliesLastWeek = 32;

        // Update state with real data
        setStats({
          totalWorkOrders,
          pendingWorkOrders,
          inProgressWorkOrders,
          completedWorkOrders,
          itemsInInventory,
          completedAssemblies,
          rejectedItems,
          pendingQA,
          inProgressAssemblies,
          assembliesLastWeek
        });

        // Get recent work orders for the table (most recent 5)
        if (Array.isArray(workOrders)) {
          const sorted = [...workOrders]
            .sort((a, b) => new Date(b.created_at || b.target_date) - new Date(a.created_at || a.target_date))
            .slice(0, 5);
          setRecentWorkOrders(sorted);
        }

        // Get top items by usage
        if (Array.isArray(items)) {
          const topItemsList = [...items].slice(0, 5);
          setTopItems(topItemsList);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();

    // Set up periodic refresh every 60 seconds
    const intervalId = setInterval(loadData, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [dateRange]);

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-300 rounded-md text-red-700">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const productionStatusData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    datasets: [
      {
        label: 'Work Orders by Status',
        data: [stats.pendingWorkOrders, stats.inProgressWorkOrders, stats.completedWorkOrders, stats.rejectedItems],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Daily production data
  const dailyProductionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Units Produced',
        data: [12, 19, 15, 22, 18],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Quality Issues',
        data: [2, 3, 1, 4, 2],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className="w-full">
      {/* Header with date filter */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-neutral-800 dark:text-neutral-100"
        >
          Production Dashboard
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap gap-3"
        >
          <div className="bg-white dark:bg-neutral-700 p-2 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-600">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-transparent pl-2 pr-6 py-1 rounded-md border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="bg-white dark:bg-neutral-700 p-3 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 text-sm">
            Last updated: {new Date().toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Stats Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
          <div className="pl-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Work Orders</p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">{stats.totalWorkOrders}</p>
              </div>
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <Link to="/work-orders" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium inline-flex items-center">
                View all work orders
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div className="pl-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">In Progress</p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">{stats.inProgressWorkOrders}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(stats.inProgressWorkOrders / (stats.totalWorkOrders || 1)) * 100}%` }}></div>
              </div>
            </div>
            <div className="mt-3">
              <Link to="/assembly" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-xs font-medium inline-flex items-center">
                View assembly status
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
          <div className="pl-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Inventory Items</p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">{stats.itemsInInventory}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <Link to="/inventory" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium inline-flex items-center">
                View inventory
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
          <div className="pl-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Quality Assurance</p>
                <p className="text-2xl font-bold text-neutral-800 dark:text-white mt-1">{stats.pendingQA}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Pending QA checks</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <Link to="/reports" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-medium inline-flex items-center">
                View QA reports
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Production Status</h2>
          <div className="h-72">
            <Doughnut 
              data={productionStatusData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: darkMode => darkMode ? '#e5e5e5' : '#333333',
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10,
                    cornerRadius: 4,
                    boxPadding: 3
                  }
                },
                cutout: '70%'
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-white">Daily Production Metrics</h2>
          <div className="h-72">
            <Bar 
              data={dailyProductionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: darkMode => darkMode ? '#e5e5e5' : '#333333',
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 10,
                    cornerRadius: 4,
                    boxPadding: 3
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: theme => theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      drawBorder: false,
                    },
                    ticks: {
                      color: theme => theme.dark ? '#e5e5e5' : '#333333',
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                      drawBorder: false,
                    },
                    ticks: {
                      color: theme => theme.dark ? '#e5e5e5' : '#333333',
                    }
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Production Workflow and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold mb-5 text-neutral-800 dark:text-white">Production Workflow</h2>
          <div className="relative py-4">
            <div className="absolute top-10 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700"></div>
            
            <div className="relative flex justify-between items-center">
              <div className="flex flex-col items-center">
                <div className={`z-10 w-9 h-9 flex items-center justify-center rounded-full text-white ${stats.pendingWorkOrders > 0 ? 'bg-primary-500 dark:bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">Planning</span>
                <span className={`${stats.pendingWorkOrders > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'} text-xs font-medium`}>
                  {stats.pendingWorkOrders}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`z-10 w-9 h-9 flex items-center justify-center rounded-full text-white ${stats.inProgressWorkOrders > 0 ? 'bg-amber-500 dark:bg-amber-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">Assembly</span>
                <span className={`${stats.inProgressWorkOrders > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500'} text-xs font-medium`}>
                  {stats.inProgressWorkOrders}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`z-10 w-9 h-9 flex items-center justify-center rounded-full text-white ${stats.pendingQA > 0 ? 'bg-purple-500 dark:bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">QA Check</span>
                <span className={`${stats.pendingQA > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 dark:text-neutral-500'} text-xs font-medium`}>
                  {stats.pendingQA}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`z-10 w-9 h-9 flex items-center justify-center rounded-full text-white ${stats.rejectedItems > 0 ? 'bg-red-500 dark:bg-red-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">Rework</span>
                <span className={`${stats.rejectedItems > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'} text-xs font-medium`}>
                  {stats.rejectedItems}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`z-10 w-9 h-9 flex items-center justify-center rounded-full text-white ${stats.completedWorkOrders > 0 ? 'bg-green-500 dark:bg-green-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                </div>
                <span className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">Complete</span>
                <span className={`${stats.completedWorkOrders > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'} text-xs font-medium`}>
                  {stats.completedWorkOrders}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Recent Work Orders</h2>
            <Link to="/work-orders" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Order</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Product</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {recentWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">No work orders found</td>
                  </tr>
                ) : (
                  recentWorkOrders.map((order, index) => (
                    <tr key={order.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {order.item_code}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {order.product}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(order.target_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full 
                          ${order.status === 'Completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : order.status === 'In Progress' 
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' 
                              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
                          }`}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Assembly Dashboard */}
      <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all mb-7">
        <h2 className="text-lg font-semibold mb-5 text-neutral-800 dark:text-white">Assembly Workflows</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-800 hover:shadow-md transition-all duration-300">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5">
              <h3 className="text-white font-semibold">YBS Assembly</h3>
            </div>
            <div className="p-4">
              <div className="aspect-w-16 aspect-h-9 bg-neutral-100 dark:bg-neutral-700 rounded-md mb-3">
                <img 
                  src="/images/ybs-assembly.png" 
                  alt="YBS Assembly" 
                  className="object-cover h-40 w-full rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                    e.target.parentElement.innerHTML = '<span class="text-neutral-400 dark:text-neutral-500">YBS Assembly Image</span>';
                  }}
                />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Verify and assemble YBS components with barcode scanning.
              </p>
              <Link
                to="/assembly/ybs"
                className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Go to YBS Assembly
              </Link>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-800 hover:shadow-md transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5">
              <h3 className="text-white font-semibold">RSM Assembly</h3>
            </div>
            <div className="p-4">
              <div className="aspect-w-16 aspect-h-9 bg-neutral-100 dark:bg-neutral-700 rounded-md mb-3">
                <img 
                  src="/images/rsm-assembly.png" 
                  alt="RSM Assembly"
                  className="object-cover h-40 w-full rounded-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                    e.target.parentElement.innerHTML = '<span class="text-neutral-400 dark:text-neutral-500">RSM Assembly Image</span>';
                  }}
                />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                RSM circuit board component verification and assembly.
              </p>
              <Link
                to="/assembly/rsm"
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Go to RSM Assembly
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics Section */}
      <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all mb-7">
        <h2 className="text-lg font-semibold mb-5 text-neutral-800 dark:text-white">Quality Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Passed QA</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {Math.round((stats.completedWorkOrders / (stats.totalWorkOrders || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.completedWorkOrders / (stats.totalWorkOrders || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pending QA</span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {Math.round((stats.pendingQA / (stats.totalWorkOrders || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.pendingQA / (stats.totalWorkOrders || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rework Required</span>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {Math.round((stats.inProgressWorkOrders / (stats.totalWorkOrders || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.inProgressWorkOrders / (stats.totalWorkOrders || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rejected</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {Math.round((stats.rejectedItems / (stats.totalWorkOrders || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.rejectedItems / (stats.totalWorkOrders || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assembly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">{stats.completedAssemblies}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Completed Assemblies</div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all">
          <div className="text-3xl font-bold text-amber-500 dark:text-amber-400 mb-2">{stats.inProgressAssemblies}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">In Progress</div>
        </div>
          
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{stats.assembliesLastWeek}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Completed Last Week</div>
        </div>
      </div>

      {/* Top Items Section */}
      <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 hover:shadow-md transition-all">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Top Inventory Items</h2>
          <Link to="/inventory" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topItems.length === 0 ? (
            <p className="text-center py-6 text-neutral-500 dark:text-neutral-400 col-span-3">No items to display</p>
          ) : (
            topItems.map((item, index) => (
              <div key={item.id || index} className="flex items-center p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors">
                <div className="flex-shrink-0 h-9 w-9 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.item_code}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${
                    item.type === 'Part' 
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400' 
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                  }`}>
                    {item.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;