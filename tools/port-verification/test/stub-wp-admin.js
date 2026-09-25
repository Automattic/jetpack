/**
 * A wp-admin stub small enough to serve from this repo: wp-login.php, a Dashboard, and one
 * admin page whose markup changes with a query flag. Enough to exercise capture.js's login,
 * buffer clear, redirect guards and hidden/ambiguous-selector detection without a WordPress.
 */

import http from 'node:http';

const COOKIE = 'stub_logged_in=1';

const LOGIN_PAGE = `<!doctype html><html><body><form name="loginform" id="loginform" method="POST" action="/wp-login.php">
<input id="user_login" name="log"><input id="user_pass" name="pwd" type="password">
<button id="wp-submit" type="submit">Log In</button></form></body></html>`;

const DASHBOARD = `<!doctype html><html><body><div id="wpadminbar">bar</div>
<div id="wpwrap"><div id="wpbody"><div id="dashboard-widgets">widgets</div></div></div>
<script src="/dashboard-only.js"></script></body></html>`;

/**
 * @param {boolean} flagOn
 * @return {string}
 */
function adminPage( flagOn ) {
	// Flag-on hides #wpfooter and insets #wpwrap by 8px, the one difference the rule accepts.
	const footerStyle = flagOn ? 'display:none' : '';
	const wrapStyle = flagOn ? 'margin:8px;width:292px' : 'margin:0;width:300px';
	const mount = flagOn ? '<div id="boot-mount">mounted</div>' : '';
	const extra = flagOn ? '<script src="/boot.js"></script>' : '';
	return `<!doctype html><html><body><div id="wpadminbar" style="height:32px">bar</div>
<div id="wpwrap" style="${ wrapStyle };height:200px">
  <div id="wpbody-content" style="width:280px;height:150px">
    <div style="display:none"><button class="components-button">hidden legacy</button></div>
    <button class="components-button" style="padding:6px 12px;margin:8px">Real</button>
    <button class="only-real-button" style="padding:6px 12px;margin:8px">Real</button>
  </div>
  ${ mount }
</div>
<div id="wpfooter" style="${ footerStyle }">footer</div>
<script src="/common.js"></script>${ extra }</body></html>`;
}

/**
 * @param {object}  [options]
 * @param {boolean} [options.requireLogin] - 302 to wp-login.php without the cookie. Default true.
 * @return {Promise<{url: string, close: () => Promise<void>, requests: string[]}>}
 */
export async function startStub( options = {} ) {
	const { requireLogin = true } = options;
	const requests = [];

	const server = http.createServer( ( req, res ) => {
		requests.push( req.url );
		const url = new URL( req.url, 'http://127.0.0.1' );
		const authed = ! requireLogin || ( req.headers.cookie ?? '' ).includes( COOKIE );

		if ( url.pathname === '/wp-login.php' ) {
			if ( req.method === 'POST' ) {
				res.writeHead( 302, { 'Set-Cookie': COOKIE, Location: '/wp-admin/index.php' } );
				return res.end();
			}
			res.writeHead( 200, { 'Content-Type': 'text/html' } );
			return res.end( LOGIN_PAGE );
		}
		if ( url.pathname === '/auto-login' ) {
			res.writeHead( 302, { 'Set-Cookie': COOKIE, Location: '/wp-admin/index.php' } );
			return res.end();
		}
		if ( ! authed ) {
			res.writeHead( 302, { Location: '/wp-login.php' } );
			return res.end();
		}
		if ( url.pathname === '/wp-admin/index.php' ) {
			res.writeHead( 200, { 'Content-Type': 'text/html' } );
			return res.end( DASHBOARD );
		}
		if ( url.pathname === '/wp-admin/admin.php' ) {
			res.writeHead( 200, { 'Content-Type': 'text/html' } );
			return res.end( adminPage( url.searchParams.get( 'flag' ) === 'on' ) );
		}
		if ( url.pathname === '/elsewhere' ) {
			res.writeHead( 302, { Location: '/wp-admin/index.php' } );
			return res.end();
		}
		if ( url.pathname.endsWith( '.js' ) ) {
			res.writeHead( 200, { 'Content-Type': 'application/javascript' } );
			return res.end( '/* */' );
		}
		res.writeHead( 404, { 'Content-Type': 'text/plain' } );
		res.end( 'not found' );
	} );

	await new Promise( resolve => server.listen( 0, '127.0.0.1', resolve ) );
	return {
		url: `http://127.0.0.1:${ server.address().port }`,
		requests,
		close: () => new Promise( resolve => server.close( resolve ) ),
	};
}
