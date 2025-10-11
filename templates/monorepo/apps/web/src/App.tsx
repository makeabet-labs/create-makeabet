import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AppConfig {
  paypalClientId: string;
  pythEndpoint: string;
  targetChain: string;
}

export function App() {
  const { data, isLoading } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: async () => {
      const { data: config } = await axios.get<AppConfig>('/api/config');
      return config;
    },
  });

  if (isLoading) {
    return <p className="status">載入設定中...</p>;
  }

  return (
    <main className="layout">
      <header>
        <h1>MakeABet Scaffold</h1>
        <p>PayPal + PYUSD + Pyth 黑客松啟動套件</p>
      </header>

      <section className="card">
        <h2>環境設定</h2>
        <dl>
          <dt>PayPal Client ID</dt>
          <dd>{data?.paypalClientId || '尚未設定'}</dd>
          <dt>Pyth Hermes Endpoint</dt>
          <dd>{data?.pythEndpoint}</dd>
          <dt>目標鏈別</dt>
          <dd>{data?.targetChain}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>下一步</h2>
        <ol>
          <li>完成 PayPal Sandbox OAuth 設定，填入 `.env`。</li>
          <li>使用 Hardhat 測試與部署合約。</li>
          <li>部署 API / Worker 至 Railway，前端至 Vercel 或 Railway。</li>
        </ol>
      </section>
    </main>
  );
}
