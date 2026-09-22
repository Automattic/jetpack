import { chromium } from 'playwright';
const HOST = 'cgatomic2.wpcomstaging.com';
const URL = `https://${ HOST }/wp-admin/admin.php?page=jetpack-backup`;

const cookies = process.env.COOKIES.split( '\n' ).filter( Boolean ).map( line => {
	const [ name, value ] = line.split( '~' );
	return { name, value, domain: HOST, path: '/', httpOnly: true, secure: true };
} );

const b = await chromium.launch( { headless: true } );
const ctx = await b.newContext( { viewport: { width: 1440, height: 1000 } } );
await ctx.addCookies( cookies );
const p = await ctx.newPage();
await p.goto( URL, { waitUntil: 'domcontentloaded', timeout: 60000 } );
await p.waitForTimeout( 10000 );

console.log( JSON.stringify( {
	title: await p.title(),
	url: p.url().slice( 0, 70 ),
	slot: await p.locator( '#jp-admin-notices' ).count(),
	card: await p.locator( '#jp-admin-notices .jitm-card' ).count(),
	foreign: await p.getByText( 'upgrade to Pro' ).count(),
} ) );

await p.screenshot( { path: process.env.OUT } );
await b.close();
