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
const jitmReqs = [];
p.on('response', async r => {
	if (r.url().includes('jitm')) {
		let body = '';
		try { body = (await r.text()).slice(0, 200); } catch {}
		jitmReqs.push({ url: r.url().slice(0, 110), status: r.status(), body });
	}
});
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
await p.goto(`https://${HOST}/wp-admin/admin.php?page=jetpack-backup`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(12000);
console.log(JSON.stringify({
	placeholder: await p.locator('.jetpack-jitm-message').count(),
	slot: await p.locator('#jp-admin-notices').count(),
	card: await p.locator('.jitm-card').count(),
	jitmReqs,
	errs: errs.slice(0, 4),
}, null, 1));
await b.close();
