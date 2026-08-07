import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 全域錯誤邊界：任何未捕捉的例外（例如 localStorage 異常）
 * 都會顯示友善的錯誤畫面，而不是整頁白屏。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  private handleReload = () => {
    // 清空可能損壞的狀態再重新載入
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-dex-bg text-dex-text flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">🐦💥</div>
          <h1 className="text-xl font-black text-white mb-2">哎呀！發生了一點意外</h1>
          <p className="text-sm text-dex-muted mb-1 max-w-xs">
            你的捕捉記錄都安全保存在瀏覽器中，重新載入就可以繼續。
          </p>
          {this.state.message && (
            <p className="text-[10px] text-dex-muted/60 font-mono mb-6 max-w-xs break-all">
              {this.state.message}
            </p>
          )}
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-xl bg-dex-neon text-dex-bg font-black text-sm hover:brightness-110 transition"
          >
            重新載入
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
