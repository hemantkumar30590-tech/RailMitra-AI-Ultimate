async function test() {
  const r = await fetch('https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus?trainNo=12816&startDay=0', {
    headers: { 'x-rapidapi-key': '4d2429a496mshb2a393c12e4b94dp103165jsn1ec788bbf722' }
  });
  const d = await r.json();
  console.log(d);
}
test();
