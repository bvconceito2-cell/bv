import React, { useState } from 'react';
import { Mail, Send, Target, Users, Layout, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Marketing = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marketing & Engajamento</h1>
          <p className="text-sm text-gray-500">Ferramentas para aumentar suas vendas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/cupons" className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:border-[#04548c] transition-all group">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4 group-hover:bg-[#04548c] group-hover:text-white transition-colors">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Cupons de Desconto</h3>
          <p className="text-sm text-gray-500">Crie códigos promocionais e gerencie campanhas de desconto.</p>
        </Link>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm opacity-60">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">E-mail Marketing</h3>
          <p className="text-sm text-gray-500">Envie campanhas para sua base de clientes (Em breve).</p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm opacity-60">
          <div className="p-3 bg-green-50 rounded-lg w-fit mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Segmentação CRM</h3>
          <p className="text-sm text-gray-500">Agrupe clientes por comportamento de compra (Em breve).</p>
        </div>
      </div>
    </div>
  );
};

export default Marketing;