import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { ChevronRight, ShoppingBag, Loader2, ShieldCheck, CreditCard, Zap, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreteOpcao {
  id: number;
  nome: string;
  preco: number;
  dias: number;
}

export function Checkout() {
  const { cart } = useStore();
  const [etapa, setEtapa] = useState<"carrinho" | "frete" | "pagamento" | "processando">("carrinho");

  const carrinho_itens = cart.map((item: any) => ({
    id: item.id,
    nome: item.name || item.nome,
    quantidade: item.quantity,
    preco: item.price_current || item.preco,
    imagem: item.main_image || item.imagem || item.image || item.images?.[0]
  }));

  const [cliente, setCliente] = useState({
    nome: "",
    email: "",
    telefone: ""
  });

  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  const [frete_opcoes, setFreteOpcoes] = useState<FreteOpcao[]>([]);
  const [frete_selecionado, setFreteSelecionado] = useState<FreteOpcao | null>(null);
  const [carregando_frete, setCarregandoFrete] = useState(false);
  const [erro_frete, setErroFrete] = useState("");

  const [processando, setProcessando] = useState(false);
  const [erro_pagamento, setErroPagamento] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("checkout_form_data");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setCliente({
          nome: parsed.nome || "",
          email: parsed.email || "",
          telefone: parsed.telefone || ""
        });

        setEndereco({
          cep: parsed.cep || "",
          rua: parsed.rua || "",
          numero: parsed.numero || "",
          bairro: parsed.bairro || "",
          cidade: parsed.cidade || "",
          estado: parsed.estado || ""
        });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const data = { ...cliente, ...endereco };
    localStorage.setItem("checkout_form_data", JSON.stringify(data));
  }, [cliente, endereco]);

  const handleCalcularFrete = async () => {
    if (!endereco.cep || endereco.cep.replace(/\D/g, "").length !== 8) {
      setErroFrete("Informe um CEP válido");
      return;
    }

    setCarregandoFrete(true);
    setErroFrete("");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/frete-calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: endereco.cep.replace(/\D/g, ""),
          carrinho_itens
        })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        setErroFrete(data.erro || "Erro ao calcular frete");
        return;
      }

      setFreteOpcoes(data.opcoes || []);
      setEtapa("frete");
    } catch (error) {
      setErroFrete("Erro ao conectar com o servidor");
      console.error(error);
    } finally {
      setCarregandoFrete(false);
    }
  };

  const handleFinalizarPagamento = async () => {
    if (!frete_selecionado) {
      setErroPagamento("Selecione uma opção de frete");
      return;
    }

    if (!cliente.nome || !cliente.email || !cliente.telefone) {
      setErroPagamento("Preencha seus dados de identificação");
      return;
    }

    setProcessando(true);
    setErroPagamento("");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/checkout-criar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nome: cliente.nome,
          cliente_email: cliente.email,
          cliente_telefone: cliente.telefone,
          endereco_cep: endereco.cep.replace(/\D/g, ""),
          endereco_rua: endereco.rua,
          endereco_numero: endereco.numero,
          endereco_bairro: endereco.bairro,
          endereco_cidade: endereco.cidade,
          endereco_estado: endereco.estado,
          carrinho_itens,
          frete_preco: frete_selecionado.preco,
          frete_nome: frete_selecionado.nome,
          retirada_loja: frete_selecionado.id === 999999
        })
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        setErroPagamento(data.erro || data.error || "Erro ao criar pedido");
        return;
      }

      const paymentUrl = data.payment_url || data.init_point || data.sandbox_init_point;

      if (!paymentUrl) {
        setErroPagamento(data.warning || "Pagamento criado sem link do Mercado Pago. Verifique o Access Token.");
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      setErroPagamento("Erro ao conectar com o servidor");
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };

  const subtotal = carrinho_itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const total = frete_selecionado ? subtotal + frete_selecionado.preco : subtotal;

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6 bg-brand-background">
        <div className="bg-brand-secondary p-8 rounded-full">
          <ShoppingBag className="h-12 w-12 text-[var(--store-primary)]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-brand-foreground">Seu carrinho está vazio</h2>
          <p className="text-sm text-brand-muted font-medium">Adicione alguns produtos para continuar.</p>
        </div>

        <Link to="/" className="bg-[var(--store-primary)] text-[var(--store-button-text)] px-8 py-4 rounded-brand-button font-black uppercase text-xs tracking-widest hover:opacity-90 transition-opacity">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="flex-1 space-y-12">
            <header className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-brand-foreground">Finalizar Compra</h1>

              <div className="flex items-center gap-2 text-xs font-bold text-brand-muted uppercase tracking-widest">
                <Link to="/carrinho" className="hover:text-[var(--store-primary)] transition-colors">Carrinho</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[var(--store-primary)]">Checkout</span>
              </div>
            </header>

            <div className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--store-primary)] text-[var(--store-button-text)] flex items-center justify-center text-xs font-black">1</div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-foreground">Identificação</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-brand-card p-6 rounded-brand-card border border-brand-border shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Nome Completo</label>
                    <input
                      type="text"
                      placeholder="Ex: Maria Silva"
                      className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                      value={cliente.nome}
                      onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">E-mail</label>
                      <input
                        type="email"
                        placeholder="Ex: maria@email.com"
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                        value={cliente.email}
                        onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                        value={cliente.telefone}
                        onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--store-primary)] text-[var(--store-button-text)] flex items-center justify-center text-xs font-black">2</div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-foreground">Entrega</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-brand-card p-6 rounded-brand-card border border-brand-border shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">CEP</label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="00000-000"
                          className="flex-1 bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                          value={endereco.cep}
                          onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                        />

                        <button
                          onClick={handleCalcularFrete}
                          disabled={carregando_frete}
                          className="bg-[var(--store-primary)] text-[var(--store-button-text)] px-6 rounded-brand-button font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {carregando_frete ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Calcular"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Endereço / Rua</label>
                    <input
                      type="text"
                      placeholder="Ex: Avenida das Flores"
                      className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                      value={endereco.rua}
                      onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Número</label>
                      <input
                        type="text"
                        placeholder="Nº"
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                        value={endereco.numero}
                        onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Centro"
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                        value={endereco.bairro}
                        onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: São Paulo"
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-brand-foreground placeholder:text-brand-muted"
                        value={endereco.cidade}
                        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">UF</label>
                      <input
                        type="text"
                        placeholder="SP"
                        maxLength={2}
                        className="w-full bg-brand-secondary border-none p-4 rounded-brand-button outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm uppercase text-brand-foreground placeholder:text-brand-muted"
                        value={endereco.estado}
                        onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--store-primary)] text-[var(--store-button-text)] flex items-center justify-center text-xs font-black">3</div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-foreground">Opção de Entrega</h2>
                </div>

                {erro_frete && (
                  <div className="p-4 bg-[var(--store-highlight)]/10 text-[var(--store-highlight)] text-xs font-bold rounded-brand-button border border-[var(--store-highlight)]/20 animate-in fade-in slide-in-from-top-2">
                    {erro_frete}
                  </div>
                )}

                {frete_opcoes.length === 0 ? (
                  <div className="p-12 text-center bg-brand-card rounded-brand-card border-2 border-dashed border-brand-border text-brand-muted text-sm font-medium italic">
                    Informe seu CEP para ver as opções de entrega disponíveis.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setFreteSelecionado({
                          id: 999999,
                          nome: "RETIRAR NA LOJA",
                          preco: 0,
                          dias: 0
                        })
                      }
                      className={cn(
                        "flex items-center justify-between p-5 rounded-brand-card border-2 transition-all text-left group",
                        frete_selecionado?.id === 999999
                          ? "border-[var(--store-primary)] bg-[var(--store-primary)]/5 shadow-md"
                          : "border-brand-border bg-brand-card hover:border-[var(--store-primary)]/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            frete_selecionado?.id === 999999
                              ? "border-[var(--store-primary)] bg-[var(--store-primary)]"
                              : "border-brand-border"
                          )}
                        >
                          {frete_selecionado?.id === 999999 && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--store-button-text)]" />
                          )}
                        </div>

                        <div>
                          <div className="font-black text-[11px] uppercase tracking-widest text-brand-foreground">
                            RETIRAR NA LOJA
                          </div>

                          <div className="text-[10px] text-brand-muted font-bold uppercase tracking-tighter mt-0.5 flex items-center gap-2">
                            <Truck className="h-3 w-3" />
                            Disponível imediatamente
                          </div>
                        </div>
                      </div>

                      <div className="font-black text-sm text-green-600">
                        GRÁTIS
                      </div>
                    </button>

                    {frete_opcoes.map((opcao) => (
                      <button
                        key={opcao.id}
                        onClick={() => setFreteSelecionado(opcao)}
                        className={cn(
                          "flex items-center justify-between p-5 rounded-brand-card border-2 transition-all text-left group",
                          frete_selecionado?.id === opcao.id
                            ? "border-[var(--store-primary)] bg-[var(--store-primary)]/5 shadow-md"
                            : "border-brand-border bg-brand-card hover:border-[var(--store-primary)]/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                              frete_selecionado?.id === opcao.id
                                ? "border-[var(--store-primary)] bg-[var(--store-primary)]"
                                : "border-brand-border"
                            )}
                          >
                            {frete_selecionado?.id === opcao.id && (
                              <div className="h-1.5 w-1.5 rounded-full bg-[var(--store-button-text)]" />
                            )}
                          </div>

                          <div>
                            <div className="font-black text-[11px] uppercase tracking-widest text-brand-foreground">
                              {opcao.nome}
                            </div>

                            <div className="text-[10px] text-brand-muted font-bold uppercase tracking-tighter mt-0.5 flex items-center gap-2">
                              <Truck className="h-3 w-3" />
                              Até {opcao.dias} dias úteis
                            </div>
                          </div>
                        </div>

                        <div className="font-black text-sm text-brand-foreground">
                          R$ {opcao.preco.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <aside className="w-full lg:w-[400px]">
            <div className="lg:sticky lg:top-32 space-y-6">
              <div className="bg-brand-card rounded-2xl border border-brand-border shadow-xl overflow-hidden">
                <div className="p-6 lg:p-8 bg-brand-secondary/50 border-b border-brand-border">
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-brand-foreground">Resumo do Pedido</h3>
                </div>

                <div className="p-6 lg:p-8 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {carrinho_itens.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex gap-4">
                        <div className="h-16 w-16 bg-brand-secondary rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-brand-border">
                          {item.imagem ? (
                            <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-brand-muted" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight text-brand-foreground truncate">{item.nome}</p>
                          <p className="text-[10px] text-brand-muted font-bold uppercase mt-1">Quantidade: {item.quantidade}</p>
                          <p className="text-xs font-black text-brand-foreground mt-1">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-brand-border">
                    <div className="flex justify-between text-xs font-bold text-brand-muted uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-brand-muted uppercase tracking-widest">
                      <span>Frete</span>
                      <span>{frete_selecionado ? `R$ ${frete_selecionado.preco.toFixed(2)}` : "--"}</span>
                    </div>

                    <div className="pt-4 mt-2 border-t border-brand-border">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-[var(--store-primary)] uppercase tracking-[0.2em]">Total do Pedido</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-brand-foreground">R$</span>
                            <span className="text-3xl font-black text-brand-foreground tracking-tighter">{total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-brand-muted font-bold uppercase tracking-widest bg-brand-secondary px-2 py-1 rounded">
                          PIX ou Cartão
                        </div>
                      </div>
                    </div>
                  </div>

                  {erro_pagamento && (
                    <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-100 animate-shake">
                      {erro_pagamento}
                    </div>
                  )}

                  <button
                    onClick={handleFinalizarPagamento}
                    disabled={processando || !frete_selecionado}
                    className={cn(
                      "w-full h-16 rounded-brand-button flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] transition-all shadow-lg",
                      processando || !frete_selecionado
                        ? "bg-brand-secondary text-brand-muted cursor-not-allowed"
                        : "bg-[var(--store-primary)] text-[var(--store-button-text)] hover:opacity-90 shadow-[var(--store-primary)]/20"
                    )}
                  >
                    {processando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5" />
                        Pagar Agora
                      </>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex items-center gap-3 grayscale opacity-30 text-brand-foreground">
                      <CreditCard className="h-5 w-5" />
                      <div className="h-4 w-px bg-brand-border" />
                      <div className="font-black text-[10px]">PIX</div>
                      <div className="h-4 w-px bg-brand-border" />
                      <Zap className="h-5 w-5" />
                    </div>

                    <p className="text-[9px] text-center text-brand-muted font-bold uppercase tracking-[0.1em] leading-relaxed">
                      Seu pagamento é processado com segurança via <span className="text-brand-foreground">Mercado Pago</span>. Seus dados estão protegidos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-brand-card p-4 rounded-brand-card border border-brand-border">
                  <div className="h-8 w-8 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-500">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-brand-foreground truncate">100% Seguro</p>
                    <p className="text-[8px] font-bold text-brand-muted uppercase">SSL Ativo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-brand-card p-4 rounded-brand-card border border-brand-border">
                  <div className="h-8 w-8 rounded-full bg-green-50/50 flex items-center justify-center text-green-500">
                    <Truck className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-brand-foreground truncate">Entrega Rápida</p>
                    <p className="text-[8px] font-bold text-brand-muted uppercase">Melhor Envio</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
