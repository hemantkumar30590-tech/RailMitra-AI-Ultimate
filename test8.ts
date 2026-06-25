import * as cheerio from 'cheerio';
async function test() {
  const r = await fetch('https://runningstatus.in/trains/pune-to-cstm');
  const html = await r.text();
  const $ = cheerio.load(html);
  $('table.table tbody tr').slice(0, 5).each((i, el) => {
    const tds = $(el).find('td');
    const trainNo = $(tds[0]).find('.train-no').text().trim();
    if (trainNo) {
      console.log(trainNo, $(tds[1]).find('.stn-lbl').text().trim(), '-', $(tds[2]).find('.stn-lbl').text().trim());
    }
  });
}
test();
