import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://etrain.info/in?TRAIN_BETWEEN=NDLS-CNB');
  const html = await r.text();
  const $ = cheerio.load(html);
  $('table tbody tr').slice(3, 8).each((i, el) => {
    console.log($(el).html());
  });
}
test();
