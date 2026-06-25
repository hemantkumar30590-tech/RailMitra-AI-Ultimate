async function run() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/train-status?trainNo=13287&startDay=today');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
run();
