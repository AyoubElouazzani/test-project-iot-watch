import React, { useState, useEffect } from "react";
import { ArrowDown, ArrowUp, Thermometer, RefreshCw } from "lucide-react";

const TemperatureCard = ({ time, temperature, trend }) => {
  const formatTime = (timeString) => {
    if (!timeString) return "--:--";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-96 py-8 px-6 rounded-xl border-[0.5px] border-gray-300">
      <div className="flex justify-between items-center gap-4">
        <div className="w-full flex flex-col gap-2 text-left">
          <h2 className="text-xl font-medium leading-none">Current Temperature</h2>
          <p className="font-light text-gray-400 text-base leading-none">Live reading from sensor</p>
        </div>

        <div className="text-sm text-gray-400 text-nowrap">{formatTime(time)}</div>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="flex items-center">
          <Thermometer className="h-8 w-8 mr-2 text-red-500" />
          <span className="text-5xl font-bold">
            {temperature !== null ? temperature : "--"}
          </span>
          <span className="text-2xl font-semibold ml-1">°C</span>
        </div>

        {trend !== "stable" && (
          <div className="flex items-center mt-2 text-sm font-medium">
            {trend === "up" ? (
              <>
                <ArrowUp className="h-4 w-4 mr-1 text-red-500" />
                <span className="text-red-500">Rising</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-blue-500">Falling</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TemperatureDisplay = () => {
  const [data, setData] = useState({
    temperature: null,
    time: null,
    trend: "stable"
  });
  const [loading, setLoading] = useState(true);

  const fetchTemperature = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/latest');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setData({
        temperature: result.temperature,
        time: result.time,
        trend: result.trend
      });
    } catch (err) {
      console.error('Failed to fetch temperature:', err);
      // Keep showing the component even if fetch fails
      setData(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTemperature();

    // Set up interval to fetch every 30 seconds
    const interval = setInterval(fetchTemperature, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <TemperatureCard 
        time={data.time}
        temperature={data.temperature}
        trend={data.trend}
      />
    </div>
  );
};

export default TemperatureDisplay;