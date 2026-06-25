import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://runningstatus.in/trains/ndls-to-cnb');
  const html = await r.text();
  const $ = cheerio.load(html);
  $('table.table tbody tr').each((i, el) => {
    const tds = $(el).find('td');
    const trainNo = $(tds[0]).find('.train-no').text().trim();
    if (trainNo === '12816') {
      console.log($(el).html());
    }
  });
}
test();
