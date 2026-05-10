const https = require("https");

module.exports = async function(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const JSONBIN_KEY = process.env.JSONBIN_KEY;
  const JSONBIN_BIN = process.env.JSONBIN_BIN;

  if (req.method === "GET") {
    try {
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: "api.jsonbin.io",
          path: "/v3/b/" + JSONBIN_BIN,
          method: "GET",
          headers: { "X-Master-Key": JSONBIN_KEY }
        };
        const request = https.request(options, (response) => {
          let data = "";
          response.on("data", chunk => { data += chunk; });
          response.on("end", () => { resolve(JSON.parse(data)); });
        });
        request.on("error", reject);
        request.end();
      });
      return res.status(200).json(result.record);
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const newReport = req.body;
      newReport.id = Date.now();
      newReport.timestamp = new Date().toLocaleString("en-IN");
      newReport.status = "Pending";

      const existing = await new Promise((resolve, reject) => {
        const options = {
          hostname: "api.jsonbin.io",
          path: "/v3/b/" + JSONBIN_BIN,
          method: "GET",
          headers: { "X-Master-Key": JSONBIN_KEY }
        };
        const request = https.request(options, (response) => {
          let data = "";
          response.on("data", chunk => { data += chunk; });
          response.on("end", () => { resolve(JSON.parse(data)); });
        });
        request.on("error", reject);
        request.end();
      });

      const reports = existing.record.reports || [];
      reports.unshift(newReport);

      const postData = JSON.stringify({ reports });
      await new Promise((resolve, reject) => {
        const options = {
          hostname: "api.jsonbin.io",
          path: "/v3/b/" + JSONBIN_BIN,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": JSONBIN_KEY,
            "Content-Length": Buffer.byteLength(postData)
          }
        };
        const request = https.request(options, (response) => {
          let data = "";
          response.on("data", chunk => { data += chunk; });
          response.on("end", () => { resolve(JSON.parse(data)); });
        });
        request.on("error", reject);
        request.write(postData);
        request.end();
      });

      return res.status(200).json({ success: true, report: newReport });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }
};
