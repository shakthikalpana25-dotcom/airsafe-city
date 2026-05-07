const https = require("https");

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const JSONBIN_KEY = process.env.JSONBIN_KEY;
  const JSONBIN_BIN = process.env.JSONBIN_BIN;

  // GET — fetch all reports
  if (event.httpMethod === "GET") {
    try {
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: "api.jsonbin.io",
          path: "/v3/b/" + JSONBIN_BIN,
          method: "GET",
          headers: {
            "X-Master-Key": JSONBIN_KEY
          }
        };
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", chunk => { data += chunk; });
          res.on("end", () => { resolve(JSON.parse(data)); });
        });
        req.on("error", reject);
        req.end();
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.record)
      };
    } catch(err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST — save new report
  if (event.httpMethod === "POST") {
    try {
      const newReport = JSON.parse(event.body);
      newReport.id = Date.now();
      newReport.timestamp = new Date().toLocaleString("en-IN");
      newReport.status = "Pending";

      // First get existing reports
      const existing = await new Promise((resolve, reject) => {
        const options = {
          hostname: "api.jsonbin.io",
          path: "/v3/b/" + JSONBIN_BIN,
          method: "GET",
          headers: { "X-Master-Key": JSONBIN_KEY }
        };
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", chunk => { data += chunk; });
          res.on("end", () => { resolve(JSON.parse(data)); });
        });
        req.on("error", reject);
        req.end();
      });

      const reports = existing.record.reports || [];
      reports.unshift(newReport);

      // Save updated reports
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
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", chunk => { data += chunk; });
          res.on("end", () => { resolve(JSON.parse(data)); });
        });
        req.on("error", reject);
        req.write(postData);
        req.end();
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, report: newReport })
      };
    } catch(err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }
};
