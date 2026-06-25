async function test() {
  const r = await fetch('https://www.confirmtkt.com/pnr/ajax/getTrainsBetweenStation?fromStn=NDLS&toStn=CNB');
  const d = await r.text();
  console.log(d.substring(0, 500));
}
test();
