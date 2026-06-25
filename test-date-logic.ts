
const dVal = '1';
const offset = parseInt(dVal, 10) - 1;
const now = new Date();
const targetDate = new Date(now.getTime() - (isNaN(offset) ? 0 : offset) * 24 * 60 * 60 * 1000);
      
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const parts = formatter.formatToParts(targetDate);
const year = parts.find(p => p.type === 'year')?.value || '';
const month = parts.find(p => p.type === 'month')?.value || '';
const dayVal = parts.find(p => p.type === 'day')?.value || '';
const targetYYYYMMDD = `${year}${month}${dayVal}`;
console.log('Target YYYYMMDD:', targetYYYYMMDD);
