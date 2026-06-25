
const now = new Date();
console.log('UTC NOW:', now.toISOString());
console.log('IST NOW:', now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
