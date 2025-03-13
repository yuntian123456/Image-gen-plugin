import { createErrorResponse, getPluginSettingsFromRequest, PluginErrorType } from '@lobehub/chat-plugin-sdk';
import { Settings, ImageGenResponse } from '../../types';

export const config = {
  runtime: 'edge',
  regions: ['hkg1'],
  maxDuration: 60,
};

// 默认图片尺寸
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const DEFAULT_SAMPLE_STRENGTH = 0.5;

// 图片尺寸限制
const MIN_SIZE = 512;
const MAX_SIZE = 1360;
const MIN_SAMPLE_STRENGTH = 0.1;
const MAX_SAMPLE_STRENGTH = 1.0;

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 55000;

// 创建带超时的 fetch 函数
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export default async function handler(req: Request) {
  // 添加CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'text/plain'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method !== 'POST') return createErrorResponse(405, 'Method not allowed');

  try {
    // 获取请求体并记录完整内容以便调试
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('生成端点 - 完整请求体:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('生成端点 - 解析请求体失败:', e);
      return createErrorResponse(400, '无效的请求格式');
    }

    const { prompt, negativePrompt = '' } = requestBody;

    // 处理sample_strength参数
    let sample_strength = DEFAULT_SAMPLE_STRENGTH;
    if (requestBody.sample_strength !== undefined) {
      sample_strength = Math.max(MIN_SAMPLE_STRENGTH, Math.min(MAX_SAMPLE_STRENGTH, Number(requestBody.sample_strength)));
      console.log('使用请求中提供的sample_strength:', sample_strength);
    }

    // 获取插件设置
    const pluginSettings = getPluginSettingsFromRequest<Settings>(req);
    console.log('插件设置:', pluginSettings);

    // 获取API Key - 优先使用提示词中的设置
    let apiKey = '';
    if (requestBody.apiKey && typeof requestBody.apiKey === 'string' && requestBody.apiKey.trim() !== '') {
      apiKey = requestBody.apiKey.trim();
      console.log('使用提示词中的API Key');
    } else if (pluginSettings?.apiKey) {
      apiKey = pluginSettings.apiKey;
      console.log('使用插件设置中的API Key');
    }

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供API Key，请在提示词中提供或在插件设置中配置'
      });
    }

    // 获取API URL - 优先使用提示词中的设置
    let apiUrl = '';
    if (requestBody.apiUrl && typeof requestBody.apiUrl === 'string' && requestBody.apiUrl.trim() !== '') {
      apiUrl = requestBody.apiUrl.trim();
      console.log('使用提示词中的API URL');
    } else if (pluginSettings?.apiUrl) {
      apiUrl = pluginSettings.apiUrl;
      console.log('使用插件设置中的API URL');
    }

    if (!apiUrl) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供API URL，请在提示词中提供或在插件设置中配置'
      });
    }

    // 获取模型名称
    const model = requestBody.model || pluginSettings?.model;
    if (!model) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供模型名称，请在提示词中提供或在插件设置中配置'
      });
    }

    // 处理宽度和高度参数
    let width = DEFAULT_WIDTH;
    let height = DEFAULT_HEIGHT;

    if (typeof requestBody.width === 'number' && requestBody.width > 0) {
      width = requestBody.width;
    }

    if (typeof requestBody.height === 'number' && requestBody.height > 0) {
      height = requestBody.height;
    }

    // 确保宽度和高度是8的倍数
    width = Math.floor(width / 8) * 8;
    height = Math.floor(height / 8) * 8;

    // 确保宽度和高度在有效范围内
    width = Math.max(MIN_SIZE, Math.min(MAX_SIZE, width));
    height = Math.max(MIN_SIZE, Math.min(MAX_SIZE, height));

    console.log('请求参数:', {
      apiUrl,
      model,
      width,
      height,
      sample_strength,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length
    });

    // 发送请求到图片生成服务
    console.log('发送请求到:', apiUrl);
    try {
      const response = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt,
          negative_prompt: negativePrompt,
          width: Number(width),
          height: Number(height),
          sample_strength: sample_strength
        })
      }, REQUEST_TIMEOUT);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应错误:', response.status, errorText);
        // 将HTTP状态码映射到合适的错误代码
        const errorCode = response.status === 401 ? 401 : 
                         response.status === 403 ? 403 : 
                         response.status === 404 ? 404 : 
                         response.status === 429 ? 429 : 500;
        return createErrorResponse(errorCode, `图片生成服务错误: ${errorText}`);
      }

      const result = await response.json() as ImageGenResponse;
      console.log('API响应结果:', result);

      if (!result.data || result.data.length === 0) {
        return createErrorResponse(500, '未能生成图片');
      }

      // 创建Markdown内容，包含提示词和图片尺寸信息
      const markdownContent = `提示词: "*${prompt}*" ${negativePrompt ? `\n反向提示词: "${negativePrompt}"` : ''} ${width}x${height}\n\n${result.data.map((item, index) => `![生成的图片${index + 1}](${item.url})`).join(' | ')} |\n|---|---|---|---|`;

      return new Response(markdownContent, {
        headers
      });
    } catch (error) {
      console.error('生成端点 - 错误:', error);
      return createErrorResponse(500, String(error));
    }
  } catch (error) {
    console.error('生成端点 - 错误:', error);
    return createErrorResponse(500, String(error));
  }
}
