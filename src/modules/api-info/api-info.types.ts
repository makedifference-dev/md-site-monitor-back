// Типы для модуля API Info

export interface RootInfoResponse {
  message: string;
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  endpoints: Record<string, string>;
}

// Пример данных для автоматической генерации схем
export const rootInfoResponseExample: RootInfoResponse = {
  message: 'MD Site Monitor Backend API',
  status: 'running',
  timestamp: new Date().toISOString(),
  uptime: 123.45,
  environment: 'development',
  endpoints: {
    docs: '/api-docs',
    spec: '/api-docs/json',
  },
};
