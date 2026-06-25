const test = async () => {
    try {
        const trainNo = '12810';
        const url = `https://runningstatus.confirmtkt.com/api/train/runningstatus?trainno=${trainNo}&date=23-Jun-2026`;
        const ryReq = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        console.log("Status:", ryReq.status);
        const html = await ryReq.text();
        console.log(html.slice(0, 100));
    } catch(e: any) {
        console.error(e.message);
    }
}
test();
