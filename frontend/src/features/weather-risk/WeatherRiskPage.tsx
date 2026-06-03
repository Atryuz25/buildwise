import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../shared/hooks/useAuth';
import { useToast } from '../../shared/components/ToastContext';

export const WeatherRiskPage: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [forecast, setForecast] = useState<any[]>([]);
  const [isMock, setIsMock] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const activeProjectId = user?.projectIds?.[0];

  useEffect(() => {
    // Check if current date is between Jun 1 and Sep 30
    const today = new Date();
    const month = today.getMonth() + 1; // 1-indexed
    if (month >= 6 && month <= 9) {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    const fetchWeather = async () => {
      try {
        const res = await apiClient.get(`/projects/${activeProjectId}/weather`);
        setForecast(res.forecast || []);
        setIsMock(res.isMock);
      } catch (err) {
        showToast('Failed to load 5-day weather forecast', 'error');
      }
    };
    fetchWeather();
  }, [activeProjectId]);

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-section-heading text-[24px] font-bold text-on-surface">Weather Risk Assessment</h1>
            {isMock && <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Demo Data</span>}
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Plan pours and exterior work around 5-day forecasts.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Monsoon Banner */}
        {showBanner && (
          <div className="bg-secondary-container/20 border border-secondary text-secondary p-4 rounded-lg flex items-start gap-3 shrink-0">
            <span className="material-symbols-outlined text-[24px]">water_drop</span>
            <div>
              <h3 className="font-bold">Monsoon Season Active</h3>
              <p className="text-sm mt-1">Risk thresholds are tightened. Rain probability &gt;40% triggers High Risk. Store cement bags off ground and cover aggregate stockpiles.</p>
            </div>
            <button onClick={() => setShowBanner(false)} className="ml-auto text-secondary hover:opacity-70"><span className="material-symbols-outlined">close</span></button>
          </div>
        )}

        {/* 5-day forecast strip */}
        <div className="bg-surface-lowest border border-outline-variant rounded p-6 shrink-0">
          <h2 className="font-section-heading text-lg text-primary font-bold mb-4">5-Day Forecast</h2>
          {forecast.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {forecast.map((day, index) => (
                <ForecastCard 
                  key={index}
                  day={day.date} 
                  temp={`${day.temp}°C`} 
                  rain={day.condition === 'Rain' ? '80%' : '10%'} 
                  wind={`${day.wind}km/h`} 
                  humidity="80%" 
                  icon={day.condition === 'Rain' ? 'rainy' : 'sunny'} 
                  isActive={index === 0} 
                />
              ))}
            </div>
          ) : (
            <div className="text-on-surface-variant text-sm">Loading forecast data...</div>
          )}
        </div>

        {/* Activity risk panel */}
        <div className="bg-surface-lowest border border-outline-variant rounded p-6 flex-1 min-h-0 flex flex-col">
          <h2 className="font-section-heading text-lg text-primary font-bold mb-4 border-b border-outline-variant pb-2 shrink-0">Today's Activity Risk</h2>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <ActivityRiskRow 
              activity="Concrete Slab Pour" 
              risk="High" 
              reason="Avoid after 2 PM — Heavy rain likely. High humidity will affect curing." 
            />
            <ActivityRiskRow 
              activity="Concrete Column Pour" 
              risk="Medium" 
              reason="Proceed with caution. Keep tarpaulins ready on site." 
            />
            <ActivityRiskRow 
              activity="Exterior Plastering" 
              risk="High" 
              reason="Do not proceed. Rain will wash out fresh mortar." 
            />
            <ActivityRiskRow 
              activity="Interior Masonry" 
              risk="Low" 
              reason="Safe — proceed as planned inside covered structures." 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ForecastCard = ({ day, temp, rain, wind, humidity, icon, isActive }: any) => (
  <div className={`min-w-[150px] flex-1 rounded p-4 flex flex-col items-center border ${
    isActive ? 'bg-primary-container/10 border-primary shadow-sm' : 'bg-surface border-outline-variant'
  }`}>
    <div className={`font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{day}</div>
    <span className={`material-symbols-outlined text-[40px] my-3 ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>{icon}</span>
    <div className="text-xl font-page-title font-bold text-on-surface mb-2">{temp}</div>
    <div className="w-full space-y-1 text-xs text-on-surface-variant">
      <div className="flex justify-between"><span>Rain</span> <span className={`font-bold ${parseInt(rain) > 40 ? 'text-error' : ''}`}>{rain}</span></div>
      <div className="flex justify-between"><span>Wind</span> <span className="font-bold">{wind}</span></div>
      <div className="flex justify-between"><span>Humid</span> <span className="font-bold">{humidity}</span></div>
    </div>
  </div>
);

const ActivityRiskRow = ({ activity, risk, reason }: any) => (
  <div className="border border-outline-variant rounded p-4 bg-surface flex items-center justify-between hover:border-primary-container transition-colors">
    <div className="flex items-center gap-6 w-1/2">
      <div className="w-1/3">
        <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
          risk === 'High' ? 'bg-error-container text-error' : 
          risk === 'Medium' ? 'bg-[#fff7ed] text-[#c2410c]' : 
          'bg-[#dcfce7] text-[#166534]'
        }`}>
          {risk} Risk
        </span>
      </div>
      <div className="w-2/3 font-bold text-on-surface">{activity}</div>
    </div>
    <div className="w-1/2 text-sm text-on-surface-variant border-l border-outline-variant pl-6">
      {reason}
    </div>
  </div>
);
