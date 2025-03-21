import { Context } from "@netlify/edge-functions";

export default async (request: Request) => {
  const url = new URL(request.url);
  
  // 处理预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  if (url.pathname === "/") {
    const html = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google PaLM API 代理</title>
</head>
<body>
  <h1>Google PaLM API 代理</h1>
  <p>此代理帮助绕过 Google PaLM API 的位置限制。</p>
  <p>要使用此代理，请将您的 API 请求发送到此端点，并附上适当的头部和参数。</p>
  <p>确保在请求头中包含您的 Google API 密钥，使用 <code>x-goog-api-key</code>。</p>
</body>
</html>
    `;
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // API代理核心逻辑
  const target = new URL(`https://generativelanguage.googleapis.com${url.pathname}`);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  
  const res = await fetch(target, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      "x-goog-api-key": request.headers.get("x-goog-api-key") || ""
    },
    body: request.body
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      ...Object.fromEntries(res.headers)
    }
  });
};
