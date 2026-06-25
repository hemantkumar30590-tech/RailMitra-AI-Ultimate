import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function test(url: string) {
  console.log('=== Fetching:', url, '===');
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      }
    });
    console.log('Status code:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find alert / warnings:
    let alertMsg = "";
    $('.alert, .alert-danger, .alert-warning, .text-danger, .text-warning').each((i, el) => {
       const txt = $(el).text().trim().replace(/\s+/g, ' ');
       if (txt) alertMsg += "[" + txt + "] ";
    });
    console.log('AlertMsg:', alertMsg || 'None');

    // Find date text:
    let dateFound = "";
    $('div, p, span, td').each((i, el) => {
       const t = $(el).text().trim().replace(/\s+/g, ' ');
       if (t.includes('Date') && t.length < 80) {
          dateFound = t;
       }
    });
    console.log('Date found:', dateFound);

    // Print first rows:
    $('tbody tr').slice(0, 5).each((i, el) => {
       const cls = $(el).attr('class') || 'NO-CLASS';
       const tds = $(el).find('td');
       const stnName = $(tds[1]).find('.fw-bold').text().trim();
       console.log(`  Row ${i}: Class="${cls}" | Station="${stnName}" | delays="${$(tds[4]).text().trim()}"`);
    });
    
    // Check if any station is marked as row-passed or row-current:
    const passedLen = $('tbody tr.row-passed').length;
    const currentLen = $('tbody tr.row-current').length;
    console.log(`Passed rows count: ${passedLen} | Current rows count: ${currentLen}`);
  } catch (err: any) {
    console.log('Error:', err.message);
  }
}

async function run() {
  await test('https://runningstatus.in/status/12302-on-20260621');
}
run();
