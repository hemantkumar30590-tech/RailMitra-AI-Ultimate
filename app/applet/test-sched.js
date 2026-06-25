import fs from 'fs';

async function run() {
  try {
    const response = await fetch(`https://rail-info-api-india1.p.rapidapi.com/v1/trains/19038/schedule`, {
        headers: {
            'x-rapidapi-key': "4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722",
            'x-rapidapi-host': 'rail-info-api-india1.p.rapidapi.com'
        }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
