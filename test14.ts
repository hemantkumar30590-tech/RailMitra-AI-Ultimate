import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://etrain.info/in?TRAIN_BETWEEN=NDLS-CNB');
  const html = await r.text();
  const $ = cheerio.load(html);
  $('table tbody tr').slice(0, 5).each((i, el) => {
    console.log($(el).text().replace(/\s+/g, ' '));
  });
}
test();
