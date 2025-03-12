export const config = {
  runtime: 'edge',
};

export default function handler(req: Request) {
  // 获取基本URL
  const url = new URL(req.url);
  const requestHost = req.headers.get('host');
  const requestProto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  
  // 获取环境变量中的baseUrl
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // 调试日志
  if (process.env.DEBUG === 'true') {
    console.log('环境信息:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      NEXT_PUBLIC_BASE_URL: configuredBaseUrl,
      requestUrl: url.toString(),
      requestHost,
      requestProto,
      headers: Object.fromEntries(req.headers)
    });
  }

  // 确定最终使用的baseUrl
  let baseUrl: string;
  
  if (configuredBaseUrl && configuredBaseUrl.trim() !== '') {
    // 使用配置的URL
    baseUrl = configuredBaseUrl.trim();
    console.log('使用配置的BASE_URL:', baseUrl);
  } else if (process.env.NODE_ENV === 'development') {
    // 本地开发环境
    baseUrl = `${url.protocol}//${url.host}`;
    console.log('开发环境使用请求URL:', baseUrl);
  } else if (process.env.VERCEL === '1') {
    // Vercel环境
    baseUrl = `${requestProto}://${requestHost}`;
    console.log('Vercel环境使用请求头URL:', baseUrl);
  } else {
    // 生产环境必须配置NEXT_PUBLIC_BASE_URL
    console.error('错误: 生产环境必须配置 NEXT_PUBLIC_BASE_URL');
    return new Response(JSON.stringify({
      error: '服务器配置错误',
      details: '请在生产环境中配置 NEXT_PUBLIC_BASE_URL 环境变量为外部可访问的URL'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 确保baseUrl不以斜杠结尾
  baseUrl = baseUrl.replace(/\/$/, '');

  // 构建manifest对象
  const manifest = {
    "identifier": "image-generator",
    "version": "1.0.0",
    "type": "markdown",
    "api": [
      {
        "url": `${baseUrl}/api/generate`,
        "name": "generateImage",
        "description": "根据文本提示生成图片",
        "parameters": {
          "type": "object",
          "required": ["prompt"],
          "properties": {
            "prompt": {
              "type": "string",
              "description": "图片生成提示词"
            },
            "negativePrompt": {
              "type": "string",
              "description": "反向提示词"
            },
            "width": {
              "type": "number",
              "default": 1024,
              "minimum": 512,
              "maximum": 1360,
              "multipleOf": 8,
              "description": "图片宽度（像素，512-1360之间，必须是8的倍数）"
            },
            "height": {
              "type": "number",
              "default": 1024,
              "minimum": 512,
              "maximum": 1360,
              "multipleOf": 8,
              "description": "图片高度（像素，512-1360之间，必须是8的倍数）"
            },
            "sample_strength": {
              "type": "number",
              "default": 0.5,
              "minimum": 0.1,
              "maximum": 1.0,
              "description": "生成图片的精细度（0.1-1.0之间，值越大细节越多）"
            },
            "apiKey": {
              "type": "string",
              "description": "图片生成服务的API密钥（如果在设置中未提供）"
            },
            "apiUrl": {
              "type": "string",
              "description": "图片生成服务的API地址（如果在设置中未提供）"
            },
            "model": {
              "type": "string",
              "description": "图片生成使用的模型名称（如果在设置中未提供）"
            }
          }
        }
      },
      {
        "url": `${baseUrl}/api/test-settings`,
        "name": "testSettings",
        "description": "测试设置是否正确传递",
        "parameters": {
          "type": "object",
          "properties": {
            "apiKey": {
              "type": "string",
              "description": "测试用API Key"
            },
            "apiUrl": {
              "type": "string",
              "description": "测试用API地址"
            },
            "model": {
              "type": "string",
              "description": "测试用模型名称"
            }
          }
        }
      }
    ],
    "settings": {
      "type": "object",
      "required": ["apiKey", "apiUrl", "model"],
      "properties": {
        "apiKey": {
          "type": "string",
          "default": "",
          "format": "password",
          "title": "🔑 图片生成服务 API Key",
          "description": "图片生成服务的API密钥（必填）"
        },
        "apiUrl": {
          "type": "string",
          "default": "",
          "format": "uri",
          "title": "🔗 图片生成服务 API 地址",
          "description": "图片生成服务的完整API地址（必填）。例如：https://your-domain.com/v1/images/generations"
        },
        "model": {
          "type": "string",
          "default": "",
          "title": "🎨 绘图模型",
          "description": "图片生成使用的模型名称（必填）"
        }
      }
    },
    "meta": {
      "title": "图片生成插件",
      "description": "一个基于 AI 的图片生成插件，支持多种部署方式",
      "avatar": "🎨",
      "author": "Image Generator Plugin",
      "homepage": "https://github.com/yourusername/image-gen-plugin",
      "repository": "https://github.com/yourusername/image-gen-plugin",
      "tags": ["image", "ai", "generation"]
    }
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 