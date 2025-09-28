import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Helper to get initial dark mode state
const getInitialDark = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (localStorage.getItem("theme")) {
      return localStorage.getItem("theme") === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

const TemperatureChart = () => {
  const [isDark, setIsDark] = useState(getInitialDark());
  const [temperatureData, setTemperatureData] = useState({
    timestamps: [],
    temperatures: [],
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for changes to the body's class (dark mode toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch temperature history from API
  const fetchTemperatureHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/history');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setTemperatureData({
        timestamps: result.lastTimestamps || [],
        temperatures: result.lastTemperatures || [],
        count: result.count || 0
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch temperature history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTemperatureHistory();

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(fetchTemperatureHistory, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format timestamps for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  // Prepare chart data
  const chartData = {
    labels: temperatureData.timestamps.map(formatTimestamp),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData.temperatures,
        borderColor: isDark ? '#ef4444' : '#dc2626',
        backgroundColor: isDark ? '#ef444430' : '#dc262630',
        pointBackgroundColor: isDark ? '#ef4444' : '#dc2626',
        pointBorderColor: isDark ? '#ffffff' : '#000000',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
        tension: 0.2,
        borderWidth: 3
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "#333" : "#e5e7eb",
          borderColor: isDark ? "#444" : "#d1d5db"
        },
        ticks: {
          color: isDark ? "#f1f5f9" : "#374151",
          font: {
            size: 12
          },
          maxRotation: 45
        },
        title: {
          display: true,
          text: 'Time',
          color: isDark ? "#f1f5f9" : "#374151",
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      y: {
        grid: {
          color: isDark ? "#333" : "#e5e7eb",
          borderColor: isDark ? "#444" : "#d1d5db"
        },
        ticks: {
          color: isDark ? "#f1f5f9" : "#374151",
          font: {
            size: 12
          },
          callback: function(value) {
            return value + '°C';
          }
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: isDark ? "#f1f5f9" : "#374151",
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? "#f1f5f9" : "#1f2937",
          font: {
            size: 14
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: isDark ? "#f1f5f9" : "#1f2937",
        bodyColor: isDark ? "#f1f5f9" : "#1f2937",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Temperature: ${context.parsed.y.toFixed(1)}°C`;
          },
          title: function(context) {
            return `Time: ${context[0].label}`;
          }
        }
      }
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 lg:col-span-1 py-8 px-6 rounded-xl border-[0.5px] border-gray-300">
        <div className="w-full flex flex-col gap-2 text-left">
          <h2 className="text-xl font-medium leading-none">Temperature History</h2>
          <p className="font-light text-gray-400 text-base leading-none">Loading temperature data...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 lg:col-span-1 py-8 px-6 rounded-xl border-[0.5px] border-gray-300">
        <div className="w-full flex flex-col gap-2 text-left">
          <h2 className="text-xl font-medium leading-none">Temperature History</h2>
          <p className="font-light text-red-400 text-base leading-none">Error loading data: {error}</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <button 
            onClick={fetchTemperatureHistory}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:col-span-1 py-8 px-6 rounded-xl border-[0.5px] border-gray-300">
      <div className="w-full flex flex-col gap-2 text-left">
        <h2 className="text-xl font-medium leading-none">Temperature History</h2>
        <p className="font-light text-gray-400 text-base leading-none">
          Last {temperatureData.count} temperature readings
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-full h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Temperature stats */}
      {temperatureData.temperatures.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Current</p>
            <p className="text-lg font-bold text-red-500">
              {temperatureData.temperatures[temperatureData.temperatures.length - 1]?.toFixed(1)}°C
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Average</p>
            <p className="text-lg font-bold text-blue-500">
              {(temperatureData.temperatures.reduce((a, b) => a + b, 0) / temperatureData.temperatures.length).toFixed(1)}°C
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Range</p>
            <p className="text-lg font-bold text-green-500">
              {(Math.max(...temperatureData.temperatures) - Math.min(...temperatureData.temperatures)).toFixed(1)}°C
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureChart;