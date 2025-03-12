import { createErrorResponse, getPluginSettingsFromRequest, PluginErrorType } from '@lobehub/chat-plugin-sdk';
import { Settings, ImageGenResponse } from '../src/types';

export const config = {
  runtime: 'edge',
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
      console.log('完整请求体:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('解析请求体失败:', e);
      return createErrorResponse(400, '无效的请求格式');
    }
    
    const { prompt, negativePrompt = '', settings = {} } = requestBody;
    
    // 处理sample_strength参数
    let sample_strength = DEFAULT_SAMPLE_STRENGTH;
    if (requestBody.sample_strength !== undefined) {
      sample_strength = Math.max(MIN_SAMPLE_STRENGTH, Math.min(MAX_SAMPLE_STRENGTH, Number(requestBody.sample_strength)));
      console.log('使用请求中提供的sample_strength:', sample_strength);
    }
    
    // 尝试从多个来源获取API Key
    let apiKey = '';
    
    // 1. 首先尝试从SDK获取设置
    const pluginSettings = getPluginSettingsFromRequest<Settings>(req);
    if (pluginSettings && pluginSettings.apiKey && typeof pluginSettings.apiKey === 'string' && pluginSettings.apiKey.trim() !== '') {
      apiKey = pluginSettings.apiKey.trim();
      console.log('从SDK获取到API Key');
    }
    // 2. 然后尝试从直接参数获取
    else if (requestBody.apiKey && typeof requestBody.apiKey === 'string' && requestBody.apiKey.trim() !== '') {
      apiKey = requestBody.apiKey.trim();
      console.log('从直接参数获取到API Key');
    }
    // 3. 最后尝试从settings中获取
    else if (settings.apiKey && typeof settings.apiKey === 'string' && settings.apiKey.trim() !== '') {
      apiKey = settings.apiKey.trim();
      console.log('从settings获取到API Key');
    }
    
    // 获取API URL，优先使用内部通信URL
    let apiUrl = '';
    if (process.env.INTERNAL_API_URL && settings.apiUrl) {
      // 如果提供了内部通信URL，将外部URL替换为内部URL
      apiUrl = settings.apiUrl.replace(process.env.PLUGIN_PUBLIC_URL, process.env.INTERNAL_API_URL);
      console.log('使用内部通信URL:', apiUrl);
    } else {
      apiUrl = settings.apiUrl || requestBody.apiUrl;
      console.log('使用原始API URL:', apiUrl);
    }
    
    // 尝试从多个来源获取模型名称
    let model = '';
    
    // 1. 首先尝试从SDK获取设置
    if (pluginSettings && pluginSettings.model && typeof pluginSettings.model === 'string' && pluginSettings.model.trim() !== '') {
      model = pluginSettings.model.trim();
      console.log('从SDK获取到模型名称');
    }
    // 2. 然后尝试从直接参数获取
    else if (requestBody.model && typeof requestBody.model === 'string' && requestBody.model.trim() !== '') {
      model = requestBody.model.trim();
      console.log('从直接参数获取到模型名称');
    }
    // 3. 最后尝试从settings中获取
    else if (settings.model && typeof settings.model === 'string' && settings.model.trim() !== '') {
      model = settings.model.trim();
      console.log('从settings获取到模型名称');
    }
    
    // 检查model是否提供
    if (!model) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供模型名称，请在插件设置中配置您的模型名称，或在请求中直接提供'
      });
    }
    
    console.log('API Key检查:', {
      pluginSettingsExists: !!pluginSettings,
      pluginSettingsApiKeyExists: !!(pluginSettings && pluginSettings.apiKey),
      pluginSettingsApiUrlExists: !!(pluginSettings && pluginSettings.apiUrl),
      pluginSettingsModelExists: !!(pluginSettings && pluginSettings.model),
      settingsExists: !!settings,
      settingsApiKeyExists: !!settings.apiKey,
      settingsApiUrlExists: !!settings.apiUrl,
      settingsModelExists: !!settings.model,
      directApiKeyExists: !!requestBody.apiKey,
      directApiUrlExists: !!requestBody.apiUrl,
      directModelExists: !!requestBody.model,
      apiKeyFound: !!apiKey,
      apiUrlFound: apiUrl,
      modelFound: model
    });
    
    // 检查API Key是否提供
    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供API Key，请在插件设置中配置您的API Key，或在请求中直接提供'
      });
    }
    
    // 检查API URL是否提供
    if (!apiUrl) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: '未提供API URL，请在插件设置中配置您的API URL，或在请求中直接提供'
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
    
    console.log('Using API Key:', apiKey ? '已提供' : '未提供');
    console.log('API Key长度:', apiKey.length);
    console.log('Using API URL:', apiUrl);
    console.log('Using Model:', model);
    console.log('Settings:', JSON.stringify(settings));
    console.log('Direct params:', `width=${requestBody.width}, height=${requestBody.height}`);
    console.log('Final dimensions:', `${width}x${height}`);
    
    // 发送请求到图片生成服务
    console.log('发送请求到:', apiUrl);
    const response = await fetch(`${apiUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        negativePrompt,
        width: Number(width),
        height: Number(height),
        sample_strength: sample_strength
      })
    });
    
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
    
    if (!result.data || result.data.length === 0) {
      return createErrorResponse(500, '未能生成图片');
    }
    
    // 创建Markdown内容，包含提示词和图片尺寸信息
    const markdownContent = `提示词： "*${prompt}*" (${width}x${height}) \n\n| ${result.data.map((item, index) => `![生成的图片${index + 1}](${item.url})`).join(' | ')} |\n|---|---|---|---|`;
    
    // 直接返回Markdown文本
    return new Response(markdownContent, {
      headers
    });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, String(error));
  }
} 