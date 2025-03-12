/**
 * @description: 插件类型定义
 */

// 插件设置类型
export interface Settings {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}

// 图片生成响应类型
export interface ImageGenResponse {
  data: Array<{
    url: string;
  }>;
} 