import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductComponents';
import { ChevronRight } from 'lucide-react';
import { SEO } from '../components/layout/SEO';

const CategoryPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { products, categories, fetchFromSupabase, config }: any = useStore();
  const searchQuery = searchParams.get('q');
  
  useEffect(() => {
    fetchFromSupabase();
  }, []);

  const isSearch = id === 'search';
  const category = isSearch 
    ? { nome: searchQuery ? `Resultados para: "${searchQuery}"` : 'Busca', slug: 'search' }
    : categories.find((c: any) => c.slug === id || String(c.id) === id);

  const categoryProducts = isSearch
    ? products.filter((p: any) => 
        p.name?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
        p.description?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
        p.brand?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
      )
    : products.filter((p: any) => String(p.category) === String(category?.id));

  if (!category) return (
    <Layout>
      <div className="py-20 text-center">Categoria não encontrada</div>
    </Layout>
  );

  return (
    <Layout>
      <SEO 
        title={category.nome}
        description={`Confira a coleção de ${category.nome} na ${config?.nome_loja || 'nossa loja'}. As melhores peças com elegância e sofisticação.`}
        breadcrumb={[
          { name: 'Início', item: '/' },
          { name: category.nome, item: `/category/${category.slug}` }
        ]}
      />
      <div className="bg-[var(--card)] border-b border-brand-border">
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-[10px] text-brand-muted font-black uppercase tracking-widest">
            <Link to="/" className="hover:text-[var(--store-primary)]">Início</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-foreground">{category.nome}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-brand-foreground mb-2">{category.nome}</h1>
            <p className="text-xs lg:text-sm text-brand-muted font-bold uppercase tracking-widest">{categoryProducts.length} produtos encontrados</p>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="py-20 text-center bg-brand-card rounded-brand-card border border-dashed border-brand-border">
            <p className="text-brand-muted">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categoryProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryPage;
