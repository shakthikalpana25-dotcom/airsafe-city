const https = require("https");

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const prompt = body.prompt || "What is AQI?";
    const GROQ_KEY = process.env.GROQ_KEY;

    const postData = JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: "You are Vaayu AI, an air quality assistant for AirSafe City, an Indian smart city app. Answer only about air quality, AQI, pollution, and health. Keep answers short, friendly, and helpful."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + GROQ_KEY,
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(e); }
        });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });

    const reply = result.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: reply || null, debug: JSON.stringify(result) })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: null, error: err.message })
    };
  }
};
