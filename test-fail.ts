import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
async function test() {
  const url = `https://runningstatus.in/status/12302-on-20260621`;
  console.log("Scraping:", url);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const trs = $('tbody tr');
  console.log("Found trs:", trs.length);
  
  if (trs.length > 0) {
     const tds = $(trs[0]).find('td');
     console.log("TDS classes:", tds.length);
  }
}
test();
