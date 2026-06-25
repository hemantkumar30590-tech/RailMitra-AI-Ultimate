import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function scrape(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log(`URL: ${url} -> tr count: ${$('tbody tr').length}`);
}

async function main() {
  await scrape('https://runningstatus.in/status/12302-on-20260621');
  await scrape('https://runningstatus.in/status/12302-today');
  
  await scrape('https://runningstatus.in/status/12409-on-20260621');
  await scrape('https://runningstatus.in/status/12409-today');
}
main();
