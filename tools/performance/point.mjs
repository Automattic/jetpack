import { chromium } from 'playwright';
const HOST = 'cgatomic2.wpcomstaging.com';
const cookies = process.env.COOKIES.split('\n').filter(Boolean).map(l => {
	const [name, value] = l.split('~');
	return { name, value, domain: HOST, path: '/', httpOnly: true, secure: true };
});
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.addCookies(cookies);
const p = await ctx.newPage();
await p.goto(`https://${HOST}/wp-admin/admin.php?page=jetpack-backup`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(12000);
const at = await p.evaluate(() => {
	const el = document.elementFromPoint(80, 90);
	if (!el) return 'nothing at 80,90';
	const chain = [];
	for (let n = el; n && chain.length < 7; n = n.parentElement) {
		chain.push(`${n.tagName}${n.id ? '#' + n.id : ''}${n.className ? '.' + n.className.toString().split(' ')[0] : ''}`);
	}
	return { text: el.textContent.slice(0, 60), chain, frames: document.querySelectorAll('iframe').length };
});
console.log(JSON.stringify(at, null, 1));
await b.close();
