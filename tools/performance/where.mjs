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
const info = await p.evaluate(() => {
	const cards = [...document.querySelectorAll('.jitm-card')];
	return {
		total: cards.length,
		inSlot: document.querySelectorAll('#jp-admin-notices .jitm-card').length,
		cards: cards.map(c => {
			const r = c.getBoundingClientRect();
			const path = [];
			for (let n = c.parentElement; n && path.length < 4; n = n.parentElement) {
				path.push(n.id ? '#' + n.id : n.className.toString().split(' ')[0] || n.tagName);
			}
			return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }, parents: path };
		}),
		placeholders: [...document.querySelectorAll('.jetpack-jitm-message')].map(e => ({
			visible: e.getClientRects().length > 0,
			parent: e.parentElement?.id || e.parentElement?.className?.toString().split(' ')[0],
		})),
	};
});
console.log(JSON.stringify(info, null, 1));
await b.close();
