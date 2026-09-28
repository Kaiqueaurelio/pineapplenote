import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportLovableError(
      error,
      {
        boundary: "react_app_error_boundary",
        componentStack: errorInfo.componentStack,
      },
      { mechanism: "react_error_boundary", handled: false, severity: "error" },
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Algo não saiu como esperado
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Esta parte da tela encontrou um problema. Tente novamente sem perder o restante da sua sessão.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
