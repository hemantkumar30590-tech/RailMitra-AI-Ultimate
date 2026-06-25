import fetch from 'node-fetch';

async function test(suffix: string) {
  const url = `https://runningstatus.in/status/12302${suffix}`;
  const res = await fetch(url, { redirect: 'manual' });
  console.log(`URL: ${url}`);
  console.log(`Status: ${res.status}`);
  console.log(`Location: ${res.headers.get('location')}`);
}

async function main() {
  await test('-on-20260621');
  await test('-today');
  await test('');
}
main();
