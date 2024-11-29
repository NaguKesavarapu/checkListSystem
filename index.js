// Import required modules
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Checklist Rules Configuration
const checklistRules = [
  {
    name: "Valuation Fee Paid",
    key: "isValuationFeePaid",
    validate: (data) => data.isValuationFeePaid === true,
  },
  {
    name: "UK Resident",
    key: "isUkResident",
    validate: (data) => data.isUkResident === true,
  },
  {
    name: "Risk Rating Medium",
    key: "riskRating",
    validate: (data) => data.riskRating === "Medium",
  },
  {
    name: "LTV Below 60%",
    key: "ltv",
    validate: (data) => {
      if (data.loanRequired && data.purchasePrice) {
        const ltv = (data.loanRequired / data.purchasePrice) * 100;
        return ltv < 60;
      }
      return false;
    },
  },
];

// Fetch and evaluate the checklist data
async function fetchAndEvaluateData() {
  const apiUrl =
    "http://qa-gb.api.dynamatix.com:3100/api/applications/getApplicationById/67339ae56d5231c1a2c63639";
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Evaluate rules
    const results = checklistRules.map((rule) => ({
      name: rule.name,
      status: rule.validate(data) ? "Passed" : "Failed",
    }));

    return results;
  } catch (error) {
    console.error("Error fetching data from API:", error.message);
    return [];
  }
}

// Serve the dashboard
app.get("/", async (req, res) => {
  const evaluationResults = await fetchAndEvaluateData();

  // Generate the HTML dashboard
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checklist Dashboard</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        padding: 0;
        background-color: #f4f4f9;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
      }
      th {
        background-color: #007bff;
        color: white;
      }
      td {
        background-color: #f9f9f9;
      }
      .passed {
        color: green;
        font-weight: bold;
      }
      .failed {
        color: red;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <h1>Checklist Evaluation Dashboard</h1>
    <table>
      <thead>
        <tr>
          <th>Rule</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${evaluationResults
          .map(
            (result) => `
        <tr>
          <td>${result.name}</td>
          <td class="${
            result.status === "Passed" ? "passed" : "failed"
          }">${result.status}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
  </html>
  `;

  res.send(html);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
