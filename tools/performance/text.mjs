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
const hits = await p.evaluate(() => {
	const out = [];
	document.querySelectorAll('*').forEach(el => {
		if (el.children.length === 0) return;
		const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
		if (!/expires in 7 days/.test(el.textContent)) return;
		const r = el.getBoundingClientRect();
		if (r.width === 0) return;
		out.push({ tag: el.tagName, cls: el.className.toString().slice(0, 50), id: el.id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) });
	});
	return out.filter(o => o.x < 170).concat(out.slice(-2));
});
console.log(JSON.stringify(hits, null, 1));
await p.screenshot({ path: process.env.OUT });
await b.close();
