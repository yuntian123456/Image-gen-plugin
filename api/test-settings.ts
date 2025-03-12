import { createErrorResponse, getPluginSettingsFromRequest, PluginErrorType } from '@lobehub/chat-plugin-sdk';
import { Settings } from '../src/types';

export const config = {
  runtime: 'edge',
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
      console.log('测试端点 - 完整请求体:', JSON.stringify(requestBody));
    } catch (e) {
      console.error('测试端点 - 解析请求体失败:', e);
      return createErrorResponse(400, '无效的请求格式');
    }

    const { settings = {} } = requestBody;

    // 尝试从多个来源获取API Key
    let apiKey = '';
    let apiKeySource = 'none';

    // 1. 首先尝试从SDK获取设置
    const pluginSettings = getPluginSettingsFromRequest<Settings>(req);
    if (pluginSettings && pluginSettings.apiKey && typeof pluginSettings.apiKey === 'string' && pluginSettings.apiKey.trim() !== '') {
      apiKey = pluginSettings.apiKey.trim();
      apiKeySource = 'sdk';
      console.log('测试端点 - 从SDK获取到API Key');
    }
    // 2. 然后尝试从直接参数获取
    else if (requestBody.apiKey && typeof requestBody.apiKey === 'string' && requestBody.apiKey.trim() !== '') {
      apiKey = requestBody.apiKey.trim();
      apiKeySource = 'parameter';
      console.log('测试端点 - 从直接参数获取到API Key');
    }
    // 3. 最后尝试从settings中获取
    else if (settings.apiKey && typeof settings.apiKey === 'string' && settings.apiKey.trim() !== '') {
      apiKey = settings.apiKey.trim();
      apiKeySource = 'settings';
      console.log('测试端点 - 从settings获取到API Key');
    }

    // 尝试从多个来源获取API URL
    let apiUrl = '';
    let apiUrlSource = 'none';

    // 1. 首先尝试从SDK获取设置
    if (pluginSettings && pluginSettings.apiUrl && typeof pluginSettings.apiUrl === 'string' && pluginSettings.apiUrl.trim() !== '') {
      apiUrl = pluginSettings.apiUrl.trim();
      apiUrlSource = 'sdk';
      console.log('测试端点 - 从SDK获取到API URL');
    }
    // 2. 然后尝试从直接参数获取
    else if (requestBody.apiUrl && typeof requestBody.apiUrl === 'string' && requestBody.apiUrl.trim() !== '') {
      apiUrl = requestBody.apiUrl.trim();
      apiUrlSource = 'parameter';
      console.log('测试端点 - 从直接参数获取到API URL');
    }
    // 3. 最后尝试从settings中获取
    else if (settings.apiUrl && typeof settings.apiUrl === 'string' && settings.apiUrl.trim() !== '') {
      apiUrl = settings.apiUrl.trim();
      apiUrlSource = 'settings';
      console.log('测试端点 - 从settings获取到API URL');
    }

    // 尝试从多个来源获取模型名称
    let model = '';
    let modelSource = 'none';

    // 1. 首先尝试从SDK获取设置
    if (pluginSettings && pluginSettings.model && typeof pluginSettings.model === 'string' && pluginSettings.model.trim() !== '') {
      model = pluginSettings.model.trim();
      modelSource = 'sdk';
      console.log('测试端点 - 从SDK获取到模型名称');
    }
    // 2. 然后尝试从直接参数获取
    else if (requestBody.model && typeof requestBody.model === 'string' && requestBody.model.trim() !== '') {
      model = requestBody.model.trim();
      modelSource = 'parameter';
      console.log('测试端点 - 从直接参数获取到模型名称');
    }
    // 3. 最后尝试从settings中获取
    else if (settings.model && typeof settings.model === 'string' && settings.model.trim() !== '') {
      model = settings.model.trim();
      modelSource = 'settings';
      console.log('测试端点 - 从settings获取到模型名称');
    }

    console.log('测试端点 - 提取的设置:', {
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
      apiKeySource,
      apiUrlFound: !!apiUrl,
      apiUrlSource,
      modelFound: !!model,
      modelSource
    });

    // 返回测试结果
    const markdownContent = `
### 设置测试结果

#### API Key
- 状态: ${apiKey ? '✅ 已提供' : '❌ 未提供'}
- 来源: ${apiKeySource}
- 长度: ${apiKey ? apiKey.length : 0}

#### API URL
- 状态: ${apiUrl ? '✅ 已提供' : '❌ 未提供'}
- 来源: ${apiUrlSource}
${apiUrl ? `- 值: \`${apiUrl}\`` : ''}

#### 绘图模型
- 状态: ${model ? '✅ 已提供' : '❌ 未提供'}
- 来源: ${modelSource}
${model ? `- 值: \`${model}\`` : ''}
`;

    return new Response(markdownContent, {
      headers
    });
  } catch (error) {
    console.error('测试端点 - 错误:', error);
    return createErrorResponse(500, String(error));
  }
} 