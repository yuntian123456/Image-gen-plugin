import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  // 从URL参数中获取初始值
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialApiKey = params.get('apiKey') || '';
    const initialApiUrl = params.get('apiUrl') || '';
    const initialModel = params.get('model') || '';

    setApiKey(initialApiKey);
    setApiUrl(initialApiUrl);
    setModel(initialModel);
  }, []);

  // 保存设置到父窗口
  const saveSettings = () => {
    const settings = {
      apiKey,
      apiUrl,
      model,
    };

    // 向父窗口发送消息
    if (window.parent) {
      window.parent.postMessage({
        type: 'PLUGIN_SETTINGS_UPDATE',
        settings,
      }, '*');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <Head>
        <title>图片生成插件设置</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>图片生成插件设置</h1>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          placeholder="输入您的API Key"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          API URL
        </label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          placeholder="例如: https://api.example.com"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          绘图模型
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          placeholder="例如: stable-diffusion-v1-5"
        />
      </div>

      <button
        onClick={saveSettings}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        保存设置
      </button>

      {saved && (
        <div style={{ marginTop: '10px', color: 'green' }}>
          设置已保存！
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h2 style={{ fontSize: '18px' }}>使用说明</h2>
        <p>
          此插件需要配置以下信息才能正常工作：
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>API Key: 您的图片生成服务API密钥</li>
          <li>API URL: 图片生成服务的API地址</li>
          <li>绘图模型: 使用的AI绘图模型名称</li>
        </ul>
        <p>
          配置完成后，您可以在聊天中使用类似&quot;生成一张猫咪的图片&quot;的提示词来生成图片。
        </p>
      </div>
    </div>
  );
};

export default Settings;