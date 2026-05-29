import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Layout } from '../components/layout/Layout';
import { SEO } from '../components/layout/SEO';
import { ChevronRight, Loader2, FileText, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const InstitutionalPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('paginas_institucionais' as any)
          .select('*')
          .eq('slug', slug)
          .eq('ativo', true)
          .maybeSingle();

        if (error) throw error;
        setPage(data);
      } catch (error) {
        console.error('Error fetching institutional page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="max-w-[1400px] mx-auto px-6 py-24 text-center">
          <FileText className="h-16 w-16 text-brand-muted opacity-20 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase tracking-tight text-brand-foreground mb-4">Página não encontrada</h1>
          <p className="text-brand-muted mb-8 font-medium">O conteúdo que você está procurando não existe ou foi removido.</p>
          <Link to="/" className="inline-block bg-brand-primary text-brand-primary-foreground px-10 py-4 font-black uppercase tracking-widest rounded-brand-button shadow-xl">
            Voltar ao Início
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title={page.meta_title || page.titulo}
        description={page.meta_description}
      />
      
      <div className="bg-[var(--card)] border-b border-brand-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] text-brand-muted font-black uppercase tracking-widest">
            <Link to="/" className="hover:text-[var(--store-primary)] transition-colors">Início</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-foreground">{page.titulo}</span>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1000px] mx-auto px-6 py-16 lg:py-24"
      >
        <header className="mb-12 border-b border-brand-border pb-12 text-center md:text-left">
          <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-brand-foreground mb-6">
            {page.titulo}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> Atualizado em {new Date(page.updated_at || page.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Leitura rápida
            </div>
          </div>
        </header>

        {page.imagem_url && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl border border-brand-border">
            <img src={page.imagem_url} alt={page.titulo} className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}

        <div className="prose prose-brand max-w-none text-brand-foreground font-medium leading-relaxed space-y-6">
          {page.conteudo.split('\n').map((para: string, i: number) => (
            para.trim() ? <p key={i}>{para}</p> : <br key={i} />
          ))}
        </div>
      </motion.div>
    </Layout>
  );
};

export default InstitutionalPage;