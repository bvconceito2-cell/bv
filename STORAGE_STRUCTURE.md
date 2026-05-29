# Estrutura de Storage (Arquivos)

O template utiliza buckets públicos no Supabase para armazenar mídias.

## Buckets Necessários

| Bucket | Finalidade | Permissões |
| :--- | :--- | :--- |
| `site-assets` | Logo, favicon e ícones do layout. | Leitura Pública / Escrita Admin |
| `produtos` | Fotos e vídeos dos produtos. | Leitura Pública / Escrita Admin |
| `banners` | Imagens de banners hero e promocionais. | Leitura Pública / Escrita Admin |
| `categorias` | Imagens de capa das categorias. | Leitura Pública / Escrita Admin |

## Recomendações de Upload

- **Logo**: PNG transparente (mínimo 400px de largura).
- **Favicon**: PNG 32x32px ou ICO.
- **Produtos**: Aspect ratio 3:4 (ex: 900x1200px) para melhor visualização.
- **Banners Hero**: 1920x600px (Desktop) / 800x800px (Mobile).
- **Banner Editorial**: 1000x1500px.
