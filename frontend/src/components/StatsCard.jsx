import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'blue',
  prefix = '',
  suffix = '',
  loading = false 
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-100',
          icon: 'text-green-600',
          accent: 'border-green-500'
        };
      case 'blue':
        return {
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          accent: 'border-blue-500'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600',
          accent: 'border-yellow-500'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          icon: 'text-red-600',
          accent: 'border-red-500'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          icon: 'text-purple-600',
          accent: 'border-purple-500'
        };
      default:
        return {
          bg: 'bg-emb-100',
          icon: 'text-emb-600',
          accent: 'border-emb-500'
        };
    }
  };

  const colors = getColorClasses();

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className={`${colors.bg} p-3 rounded-xl`}>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card hover:shadow-2xl transition-all duration-300 border-l-4 ${colors.accent}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-1">
            {prefix && <span className="text-lg font-semibold text-gray-500">{prefix}</span>}
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {suffix && <span className="text-lg font-semibold text-gray-500">{suffix}</span>}
          </div>
          
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${colors.bg} p-3 rounded-xl`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
