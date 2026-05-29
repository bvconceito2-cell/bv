import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";

export const useStore = create((set: any, get: any) => ({
  products: [],
  banners: [],
  categories: [],
  promotionalBanners: [],
  config: {},
  appearance: null,
  editorial: null,
  homeSections: [],
  cart: JSON.parse(localStorage.getItem('loja-cart') || '[]'),
  cartDrawerOpen: false,
  favorites: JSON.parse(localStorage.getItem('loja-favorites') || '[]'),
  pages: [],
  userProfile: null,
  lastFetch: 0,
  loading: true,

  fetchFromSupabase: async (force = false) => {
    if (
      !force &&
      get().lastFetch &&
      Date.now() - get().lastFetch < 300000
    ) {
      return;
    }

    try {
      set({ loading: true });

      const [
        { data: dbProducts, error: pError },
        { data: dbCategories, error: cError },
        { data: dbBanners, error: bError },
        { data: dbAppearance, error: aError },
        { data: dbSections, error: sError },
        { data: dbConfig, error: cfgError },
        { data: dbEditorial, error: eError },
        { data: dbPromotional, error: prError },
        { data: dbPages, error: pgError }
      ] = await Promise.all([
        supabase
          .from('produtos')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('categorias')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true }),

        supabase
          .from('banners_hero')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true }),

        supabase
          .from('aparencia')
          .select('*')
          .limit(1)
          .maybeSingle(),

        supabase
          .from('secoes_home')
          .select('*')
          .order('ordem', { ascending: true }),

        supabase
          .from('configuracoes')
          .select('*'),

        supabase
          .from('banner_editorial')
          .select('*')
          .limit(1)
          .maybeSingle(),

        supabase
          .from('banners_promocionais')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true }),

        (supabase
          .from('paginas_institucionais' as any)
          .select('*') as any)
          .eq('ativo', true)
          .order('ordem', { ascending: true })
      ]);

      if (pError) console.error('Error fetching products:', pError);
      if (cError) console.error('Error fetching categories:', cError);
      if (bError) console.error('Error fetching banners:', bError);
      if (aError) console.error('Error fetching appearance:', aError);
      if (sError) console.error('Error fetching home sections:', sError);
      if (cfgError) console.error('Error fetching config:', cfgError);
      if (eError) console.error('Error fetching editorial:', eError);
      if (prError) console.error('Error fetching promotional banners:', prError);
      if (pgError) console.error('Error fetching pages:', pgError);

      const mappedProducts = Array.isArray(dbProducts)
        ? dbProducts.map((p: any) => ({
            id: p.id,
            name: p.nome,
            slug: p.slug,
            brand: p.marca,
            category: String(p.categoria_id || ''),
            description: p.descricao,
            price_original: p.preco_original || 0,
            price_current: p.preco_atual || 0,
            discount:
              p.preco_original && p.preco_atual
                ? Math.round(
                    ((p.preco_original - p.preco_atual) /
                      (p.preco_original || 1)) *
                      100
                  )
                : 0,
            images: p.imagens || [],
            main_image: p.imagem_principal || p.imagens?.[0] || '',
            media: p.midias || [],
            featured: !!p.destaque,
            status: p.ativo ? 'active' : 'inactive',
            novidade: !!p.novidade,
            colors: p.cores || [],
            sizes: p.tamanhos || [],
            rating: p.avaliacao || 5,
            totalRatings: p.total_avaliacoes || 0,
            reviews_count: p.total_avaliacoes || 0,
            installments: p.parcelas || 1,
            technical: p.detalhes || {}
          }))
        : [];

      set({
        products: mappedProducts,
        categories: !cError && Array.isArray(dbCategories) ? dbCategories : [],
        banners: !bError && Array.isArray(dbBanners) ? dbBanners : [],
        editorial: !eError && dbEditorial ? dbEditorial : null,
        promotionalBanners:
          !prError && Array.isArray(dbPromotional) ? dbPromotional : [],
        pages: !pgError && Array.isArray(dbPages) ? dbPages : [],
        homeSections: !sError && Array.isArray(dbSections) ? dbSections : []
      });

      if (!aError && dbAppearance) {
        set({ appearance: dbAppearance });

        const colors = (dbAppearance as any).cores_primarias || {
          brand: '#04548c',
          background: '#ffffff',
          text: '#111111',
          highlight: '#22c55e'
        };

        const getContrastColor = (hex: string) => {
          if (!hex || hex === 'transparent') return '#ffffff';

          const cleanHex = hex.replace('#', '');

          if (cleanHex.length !== 6) return '#ffffff';

          const r = parseInt(cleanHex.slice(0, 2), 16);
          const g = parseInt(cleanHex.slice(2, 4), 16);
          const b = parseInt(cleanHex.slice(4, 6), 16);

          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          return luminance > 0.5 ? '#111111' : '#ffffff';
        };

        const adjustColor = (hex: string, amount: number) => {
          if (!hex || !hex.startsWith('#') || hex.length !== 7) return hex;

          const clamp = (val: number) => Math.min(Math.max(val, 0), 255);

          const r = clamp(parseInt(hex.slice(1, 3), 16) + amount);
          const g = clamp(parseInt(hex.slice(3, 5), 16) + amount);
          const b = clamp(parseInt(hex.slice(5, 7), 16) + amount);

          return `#${r.toString(16).padStart(2, '0')}${g
            .toString(16)
            .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };

        const primary = colors.brand || '#04548c';
        const background = colors.background || '#ffffff';
        const text = colors.text || '#111111';
        const highlight = colors.highlight || '#22c55e';

        const dynamicStyles = `
          .store-theme {
            --store-primary: ${primary};
            --store-primary-hover: ${adjustColor(primary, -30)};
            --store-background: ${background};
            --store-text: ${text};
            --store-text-muted: ${adjustColor(text, 50)};
            --store-highlight: ${highlight};
            --store-highlight-foreground: ${getContrastColor(highlight)};
            --store-card: ${background === '#ffffff' ? '#ffffff' : adjustColor(background, 10)};
            --store-border: ${adjustColor(background, -20)};
            --store-button: ${primary};
            --store-button-text: ${getContrastColor(primary)};

            --price-color: ${primary};
            --discount-color: ${highlight};
            --header-background: ${primary};
            --header-foreground: ${getContrastColor(primary)};
            --footer-background: ${background};
            --footer-foreground: ${text};
            --input-background: ${background};
            --input-border: ${adjustColor(background, -20)};
          }
        `;

        let styleTag = document.getElementById('store-dynamic-colors');

        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'store-dynamic-colors';
          document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = dynamicStyles;

        if ((dbAppearance as any).layout) {
          const layout = (dbAppearance as any).layout;

          if (layout.card_radius !== undefined) {
            document.documentElement.style.setProperty(
              '--store-radius-card',
              `${layout.card_radius}px`
            );
          }

          if (layout.button_radius !== undefined) {
            document.documentElement.style.setProperty(
              '--store-radius-button',
              `${layout.button_radius}px`
            );
          }

          if (layout.header_font) {
            document.documentElement.style.setProperty(
              '--store-header-font',
              layout.header_font
            );
          }

          if (layout.header_weight) {
            document.documentElement.style.setProperty(
              '--store-header-weight',
              layout.header_weight
            );

            document.documentElement.style.setProperty(
              '--store-font-weight-menu',
              layout.header_weight
            );
          }

          if (layout.header_spacing) {
            document.documentElement.style.setProperty(
              '--store-header-spacing',
              `${layout.header_spacing}em`
            );
          }

          if (layout.header_transform) {
            document.documentElement.style.setProperty(
              '--store-header-transform',
              layout.header_transform
            );
          }

          if (layout.header_size) {
            document.documentElement.style.setProperty(
              '--store-header-size',
              `${layout.header_size}px`
            );
          }

          if (layout.header_font) {
            const linkId = 'dynamic-google-fonts-header';
            let link = document.getElementById(linkId) as HTMLLinkElement;

            if (!link) {
              link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            }

            link.href = `https://fonts.googleapis.com/css2?family=${layout.header_font.replace(
              /\s+/g,
              '+'
            )}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
          }
        }

        if ((dbAppearance as any).fontes) {
          const fonts = (dbAppearance as any).fontes;

          if (fonts.heading) {
            document.documentElement.style.setProperty(
              '--store-font-primary',
              fonts.heading
            );

            document.documentElement.style.setProperty(
              '--store-font-heading',
              fonts.heading
            );
          }

          if (fonts.body) {
            document.documentElement.style.setProperty(
              '--store-font-body',
              fonts.body
            );
          }

          const fontsToLoad = [];

          if (fonts.heading) fontsToLoad.push(fonts.heading);
          if (fonts.body) fontsToLoad.push(fonts.body);

          if (fontsToLoad.length > 0) {
            const linkId = 'dynamic-google-fonts';
            let link = document.getElementById(linkId) as HTMLLinkElement;

            if (!link) {
              link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            }

            const uniqueFonts = [...new Set(fontsToLoad)];

            const fontFamilies = uniqueFonts
              .map((f: any) =>
                `${String(f).replace(
                  /\s+/g,
                  '+'
                )}:wght@100;200;300;400;500;600;700;800;900`
              )
              .join('&family=');

            link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
          }
        }

        if ((dbAppearance as any).favicon_url) {
          let favicon = document.querySelector('link[rel="icon"]');

          if (!favicon) {
            favicon = document.createElement('link');
            favicon.setAttribute('rel', 'icon');
            document.head.appendChild(favicon);
          }

          favicon.setAttribute('href', (dbAppearance as any).favicon_url);
        }
      }

      if (!cfgError && Array.isArray(dbConfig)) {
        const formattedConfig = dbConfig.reduce((acc: any, item: any) => {
          acc[item.chave] = item.valor;
          return acc;
        }, {});

        set((state: any) => ({
          config: {
            ...state.config,
            ...formattedConfig
          }
        }));
      }

      set({
        loading: false,
        lastFetch: Date.now()
      });
    } catch (err) {
      console.error('Failed to sync with Supabase', err);

      set({
        products: [],
        banners: [],
        categories: [],
        promotionalBanners: [],
        pages: [],
        homeSections: [],
        editorial: null,
        loading: false
      });
    }
  },

  fetchUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({ userProfile: data });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  },

  setCartDrawerOpen: (open: boolean) => set({ cartDrawerOpen: open }),

  addToCart: (product: any, color: any, size: any) => {
    const productId =
      typeof product.id === 'object'
        ? product.id.id || JSON.stringify(product.id)
        : product.id;

    const existing = get().cart.find(
      (item: any) =>
        item.id === productId &&
        item.color === color &&
        item.size === size
    );

    let newCart;

    if (existing) {
      newCart = get().cart.map((item: any) =>
        item.id === productId &&
        item.color === color &&
        item.size === size
          ? {
              ...item,
              quantity: item.quantity + 1
            }
          : item
      );
    } else {
      newCart = [
        ...get().cart,
        {
          ...product,
          id: productId,
          color,
          size,
          quantity: 1
        }
      ];
    }

    set({ cart: newCart });
    localStorage.setItem('loja-cart', JSON.stringify(newCart));
  },

  removeFromCart: (id: any, color: any, size: any) => {
    const newCart = get().cart.filter(
      (item: any) =>
        !(
          item.id === id &&
          item.color === color &&
          item.size === size
        )
    );

    set({ cart: newCart });
    localStorage.setItem('loja-cart', JSON.stringify(newCart));
  },

  updateCartQuantity: (id: any, color: any, size: any, quantity: any) => {
    const newCart = get().cart.map((item: any) =>
      item.id === id &&
      item.color === color &&
      item.size === size
        ? {
            ...item,
            quantity
          }
        : item
    );

    set({ cart: newCart });
    localStorage.setItem('loja-cart', JSON.stringify(newCart));
  },

  clearCart: () => {
    set({ cart: [] });
    localStorage.removeItem('loja-cart');
  },

  toggleFavorite: (id: any) => {
    const isFav = get().favorites.includes(id);

    const newFavorites = isFav
      ? get().favorites.filter((favId: any) => favId !== id)
      : [...get().favorites, id];

    set({ favorites: newFavorites });
    localStorage.setItem('loja-favorites', JSON.stringify(newFavorites));
  },

  updateConfig: (newConfig: any) =>
    set((state: any) => ({
      config: {
        ...state.config,
        ...newConfig
      }
    })),

  updateProducts: (newProducts: any) => set({ products: newProducts }),
  updateBanners: (newBanners: any) => set({ banners: newBanners }),
  updateCategories: (newCategories: any) => set({ categories: newCategories })
}));

export default useStore;
