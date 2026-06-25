import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://etrain.info/in?TRAIN_BETWEEN=NDLS-CNB');
  const html = await r.text();
  const $ = cheerio.load(html);
  let count = 0;
  $('.trainlist tbody tr').each((i, el) => {
    count++;
    const tds = $(el).find('td');
    if (tds.length > 5) {
      console.log($(tds[0]).text().trim(), $(tds[1]).text().trim(), $(tds[2]).text().trim(), $(tds[4]).text().trim());
    }
  });
  console.log("Total:", count);
}
test();
