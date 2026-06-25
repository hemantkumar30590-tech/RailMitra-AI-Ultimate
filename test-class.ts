import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test(trainNo: string, targetYYYYMMDD: string) {
    const url = `https://runningstatus.in/status/${trainNo}-on-${targetYYYYMMDD}`;
      const res1 = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        }
      });
      const html = await res1.text();
      const $ = cheerio.load(html);
      
      let pass = 0; let curr = 0; let upcoming = 0;
      $('tbody tr').each((i: number, el: any) => {
          if ($(el).hasClass('row-passed')) pass++;
          else if ($(el).hasClass('row-current')) curr++;
          else upcoming++;
      });
      console.log(`URL: ${url} -> Passed: ${pass}, Current: ${curr}, Upcoming: ${upcoming}`);
}

async function main() {
  await test('12302', '20260621'); 
  await test('12302', 'yesterday'); 
  await test('12302', 'today'); 
}
main();
