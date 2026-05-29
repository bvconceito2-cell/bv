import React, { useState, useEffect } from 'react';
import { ImageIcon, Layout as LayoutIcon, Type, MousePointer2, Plus, GripVertical, Edit, Trash2, Loader2, Check } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { BannerHero } from '../../../types/database';
import { toast } from 'sonner';

import PromotionalBannerAdmin from './PromotionalBannerAdmin';
import HeroBanners from './HeroBanners';

const BannerList = () => {
  const [banners, setBanners] = useState<BannerHero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners_hero')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    
    try {
      const { error } = await supabase.from('banners_hero').delete().eq('id', id);
      if (error) throw error;
      toast.success('Banner excluído!');
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const toggleAtivo = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase.from('banners_hero').update({ ativo: !current }).eq('id', id);
      if (error) throw error;
      toast.success('Status atualizado!');
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-6">
      <HeroBanners />
      
      <div className="pt-8 border-t border-gray-100">
        <PromotionalBannerAdmin />
      </div>
    </div>
  );
};

export default BannerList;