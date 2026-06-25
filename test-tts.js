const https = require('https');

const data = JSON.stringify({
	text: 'A clear female voice saying: Yatri kripya dhyan de',
	prompt_influence: 0.3,
	duration_seconds: null
});

const options = {
  hostname: 'elevenlabs-sound-effects.p.rapidapi.com',
  path: '/generate-sound',
  method: 'POST',
  headers: {
    'x-rapidapi-key': '4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722',
    'x-rapidapi-host': 'elevenlabs-sound-effects.p.rapidapi.com',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d.length + " bytes received\n");
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
