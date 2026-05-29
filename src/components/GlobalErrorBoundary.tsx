import React from "react";
import { logger } from "@/lib/logger";

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Erro crítico na UI: " + error.message, errorInfo as any);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-gray-600 mb-8 max-w-md">Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-brand-primary text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all"
          >
            RECARREGAR PÁGINA
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
