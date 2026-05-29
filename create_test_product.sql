INSERT INTO public.produtos (nome, preco_atual, preco_original, estoque, ativo, destaque, novidade, peso, altura, largura, comprimento)
VALUES ('TESTE CHECKOUT REAL', 1.00, 1.00, 999, true, true, true, 0.3, 4, 12, 17)
RETURNING id;
