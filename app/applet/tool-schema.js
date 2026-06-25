import fs from 'fs';

async function run() {
  try {
    const response = await fetch(`https://mcp.rapidapi.com/`, {
        method: 'POST',
        headers: {
            'x-api-key': "4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722",
            'x-api-host': 'rail-info-api-india1.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list",
            params: {}
        })
    });
    const data = await response.json();
    const tool = data.result.tools.find(t => t.name === 'getTrainStops');
    console.log(JSON.stringify(tool, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
