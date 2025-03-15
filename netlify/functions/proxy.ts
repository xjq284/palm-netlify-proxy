import { Context } from "@netlify/edge-functions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Goog-Api-Key",
} as const;

const FORWARD_HEADERS = ["content-type", "x-goog-api-client", "x-goog-api-key"];

export default async (request: Request, context: Context) => {
  // 处理OPTIONS预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }

  // 根路径返回说明文档
  const url = new URL(request.url);
  if (url.pathname === "/") {
    return new Response(getIndexHtml(), {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }

  try {
    // 构建Google API目标URL
    const targetUrl = new URL(
      `https://generativelanguage.googleapis.com${url.pathname}`
    );
    
    // 保留所有查询参数
    url.searchParams.forEach((value, key) => {
      if (key !== "_path") {
        targetUrl.searchParams.set(key, value);
      }
    });

    // 构造转发请求头
    const headers = new Headers();
    FORWARD_HEADERS.forEach(header => {
      const value = request.headers.get(header);
      if (value) headers.set(header, value);
    });

    // 包括body在内的双向流处理
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      body: request.body,
      // 关键修复：添加duplex参数
      ...(request.method !== "GET" && { duplex: "half" })
    };

    // 转发请求到Google API
    const apiResponse = await fetch(targetUrl, fetchOptions);

    // 返回处理过的响应
    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: {
        ...CORS_HEADERS,
        ...Object.fromEntries(apiResponse.headers)
      }
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({
      error: "Proxy Handler Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      }
    });
  }
};

function getIndexHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google PaLM API Proxy</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #1a73e8; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    pre { background: #f8f9fa; padding: 1rem; overflow-x: auto; }
    a { color: #1a73e8; text-decoration: none; }
    .warning { color: #ea8600; }
  </style>
</head>
<body>
  <h1>Google PaLM API Proxy Service</h1>
  
  <div class="warning">
    <h2>⚠️ Common Usage Scenarios</h2>
    <ul>
      <li>Solving "User location is not supported" API errors</li>
      <li>Overcoming regional restrictions for API access</li>
      <li>Adding custom authentication layers</li>
    </ul>
  </div>

  <h2>🚀 API Proxy Usage</h2>
  <p>Replace the base URL in your API calls with this service's endpoint:</p>
  <pre>https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
 → 
https://your-domain.netlify.app/v1beta/models/gemini-pro:generateContent</pre>

  <h2>🔑 Required Parameters</h2>
  <p>You must include either:</p>
  <ul>
    <li><code>key=YOUR_API_KEY</code> query parameter</li>
    <li><code>Authorization: Bearer YOUR_TOKEN</code> header</li>
  </ul>

  <h2>💡 System Status</h2>
  <ul>
    <li>Service Uptime: <span id="uptime">Loading...</span></li>
    <li>Last Updated: ${new Date().toISOString()}</li>
  </ul>

  <footer>
    <p>Documentation: <a href="https://developers.generativeai.google" target="_blank">Official API Docs</a></p>
  </footer>
</body>
</html>`;
}
