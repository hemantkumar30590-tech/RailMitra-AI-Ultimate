const apiKey = "4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722";
const host = "rail-info-api-india1.p.rapidapi.com";

const endpoints = [
  `/api/v1/liveTrainStatus?trainNo=13287&startDay=1`,
  `/api/v2/liveTrainStatus?trainNo=13287&startDay=1`,
  `/liveTrainStatus?trainNo=13287&startDay=1`,
  `/api/live-status`,
  `/api/trains/live`,
  `/liveTrain`,
  `/train/13287/liveStatus`
];

async function test() {
  for (const ep of endpoints) {
    try {
      const resp = await fetch(`https://${host}${ep}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': host
        }
      });
      console.log(`[${ep}] Status: ${resp.status}`);
      if (resp.status === 200 || resp.status === 404 || resp.status === 401 || resp.status === 400) {
        const text = await resp.text();
        console.log(`Response: ${text.substring(0, 300)}`);
      }
    } catch (err) {
      console.error(`Error on ${ep}`);
    }
  }
}
test();
