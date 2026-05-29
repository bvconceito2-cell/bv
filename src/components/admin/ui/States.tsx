
import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <Loader2 className="h-10 w-10 text-brand-primary animate-spin mb-4" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

export const EmptyState = ({ 
  title, 
  description, 
  icon: Icon,
  action 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  action?: React.ReactNode;
}) => (
  <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-8 max-w-sm mx-auto">{description}</p>
    {action}
  </div>
);
