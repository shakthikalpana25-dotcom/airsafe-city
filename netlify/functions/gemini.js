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
    const GEMINI_KEY = process.env.GEMINI_KEY;

    const result = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const options = {
        hostname: "generativelanguage.googleapis.com",
        path: "/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_KEY,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(JSON.parse(data)); });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("empty");

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ reply: null, error: err.message })
    };
  }
};
