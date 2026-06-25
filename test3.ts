import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://runningstatus.in/trains/ndls-to-cnb');
  const html = await r.text();
  const $ = cheerio.load(html);
  $('table.table tbody tr').slice(0, 2).each((i, el) => {
    console.log("---- ROW ----");
    console.log($(el).text().replace(/\s+/g, ' '));
  });
}
test();
