// import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'experimental-edge',
};

export default function handler(req: Request) {
  // 获取基本URL，优先使用环境变量，如果没有则使用请求的主机
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
  
  // 构建OpenAPI规范
  const openapi = {
    "openapi": "3.1.0",
    "info": {
      "title": "图片生成API",
      "description": "通过文本提示词生成图片的API",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": baseUrl
      }
    ],
    "paths": {
      "/api/generate": {
        "post": {
          "summary": "生成图片",
          "description": "根据提示词生成图片",
          "operationId": "generateImage",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["prompt"],
                  "properties": {
                    "prompt": {
                      "type": "string",
                      "description": "图片生成提示词"
                    },
                    "negativePrompt": {
                      "type": "string",
                      "description": "负面提示词，指定不希望出现在图片中的内容"
                    },
                    "width": {
                      "type": "integer",
                      "description": "图片宽度，范围512-2016，必须是8的倍数",
                      "default": 1024
                    },
                    "height": {
                      "type": "integer",
                      "description": "图片高度，范围512-2016，必须是8的倍数",
                      "default": 1024
                    },
                    "sample_strength": {
                      "type": "number",
                      "description": "生成精细度，范围0.1-1.0",
                      "default": 0.5
                    },
                    "apiKey": {
                      "type": "string",
                      "description": "图片生成服务的API Key"
                    },
                    "apiUrl": {
                      "type": "string",
                      "description": "图片生成服务的API URL"
                    },
                    "model": {
                      "type": "string",
                      "description": "使用的绘图模型"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "成功生成图片",
              "content": {
                "text/plain": {
                  "schema": {
                    "type": "string",
                    "description": "包含生成图片的Markdown文本"
                  }
                }
              }
            },
            "400": {
              "description": "无效的请求参数"
            },
            "401": {
              "description": "API Key无效或未提供"
            },
            "500": {
              "description": "服务器错误"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {}
    }
  };

  // 返回JSON响应
  return new Response(JSON.stringify(openapi, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}