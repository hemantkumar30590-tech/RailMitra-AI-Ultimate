import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test(trainNo: string, targetYYYYMMDD: string) {
    const url = `https://runningstatus.in/status/${trainNo}-on-${targetYYYYMMDD}`;
      const res1 = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "max-age=0"
        }
      });
      const html = await res1.text();
      const $ = cheerio.load(html);
      
      let isRunDay = true;
      $('.alert, .alert-warning, .alert-danger').each((i: number, el: any) => {
         const txt = $(el).text().trim().toLowerCase();
         if (txt.includes("does not run on this date") || txt.includes("does not run") || txt.includes("not run on this date")) {
            isRunDay = false;
         }
      });

      const stations: any[] = [];
      let lastPassedIndex = -1;
      let currentStationIndex = -1;
      
      $('tbody tr').each((i: number, el: any) => {
          const tds = $(el).find('td');
          if (tds.length < 5) return;
          
          const nameRaw = $(tds[1]).find('.fw-bold').text().trim();
          if (!nameRaw) return;
          
          stations.push({ name: nameRaw });
      });
      console.log(`URL: ${url} -> isRunDay: ${isRunDay}, stations parsed: ${stations.length}`);
}

async function main() {
  await test('12409', '20260621'); // Today in my tz (June 21, 2026)
  await test('12409', '20260622'); // Today in India tz
  await test('12409', '20260620');
}
main();
