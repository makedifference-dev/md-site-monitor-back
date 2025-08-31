// Типы для модуля API Info

export interface RootInfoResponse {
  message: string;
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  'doc-links': Record<string, string>;
}

// Пример данных для автоматической генерации схем
export const rootInfoResponseExample: RootInfoResponse = {
  message: 'MD Site Monitor Backend API',
  status: 'running',
  timestamp: new Date().toISOString(),
  uptime: 123.45,
  environment: 'development',
  'doc-links': {
    docs: '/api-docs',
    spec: '/api-docs/json',
  },
};
