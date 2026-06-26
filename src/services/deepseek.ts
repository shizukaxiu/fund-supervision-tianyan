/**
 * DeepSeek API 客户端（OpenAI 兼容接口）
 *
 * 环境变量：
 * - VITE_DEEPSEEK_API_KEY: API Key
 * - VITE_DEEPSEEK_MODEL: 模型名称，默认 deepseek-chat
 * - VITE_DEEPSEEK_API_URL: API 基础地址，默认 https://api.deepseek.com
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'text' | 'json_object' };
}

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const API_URL = (import.meta.env.VITE_DEEPSEEK_API_URL as string | undefined) || 'https://api.deepseek.com';
const MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL as string | undefined) || 'deepseek-chat';

export function hasDeepSeekConfig(): boolean {
  return Boolean(API_KEY);
}

export async function chatCompletion(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  if (!API_KEY) {
    throw new Error('DeepSeek API Key 未配置，请在 .env 中设置 VITE_DEEPSEEK_API_KEY');
  }

  const response = await fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1200,
      response_format: options.responseFormat ?? { type: 'text' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '未知错误');
    throw new Error(`DeepSeek API 请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('DeepSeek API 返回内容为空');
  }

  return content;
}
