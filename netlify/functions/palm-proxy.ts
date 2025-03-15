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

  // API代理核心逻辑
  const target = new URL(`https://generativelanguage.googleapis.com${url.pathname}`);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  
  const res = await fetch(target, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      "x-goog-api-key": request.headers.get("x-goog-api-key") || ""
    },
    body: request.body,
    duplex: "half"
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      ...Object.fromEntries(res.headers)
    }
  });
};
