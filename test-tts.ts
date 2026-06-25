fetch('https://elevenlabs-sound-effects.p.rapidapi.com/generate-sound', {
  method: 'POST',
  headers: {
    'x-rapidapi-key': '4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722',
    'x-rapidapi-host': 'elevenlabs-sound-effects.p.rapidapi.com',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({text: 'indian female railway announcer saying: Yatri kripya dhyan de', prompt_influence: 1.0})
}).then(async r => {
  const json = await r.json();
  console.log('generated', json.data.length);
}).catch(console.error);
