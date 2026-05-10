const https = require("https");

module.exports = async function(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { prompt } = req.body;
    const GROQ_KEY = process.env.GROQ_KEY;

    const postData = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are Vaayu AI, an air quality assistant for AirSafe City. Answer only about air quality, AQI, pollution, and health. Keep answers short and friendly."
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

      const request = https.request(options, (response) => {
        let data = "";
        response.on("data", chunk => { data += chunk; });
        response.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(e); }
        });
      });

      request.on("error", reject);
      request.write(postData);
      request.end();
    });

    const reply = result.choices?.[0]?.message?.content;
    return res.status(200).json({ reply: reply || null });

  } catch(err) {
    return res.status(500).json({ reply: null, error: err.message });
  }
};
