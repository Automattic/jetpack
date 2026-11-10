/*
 * Console trace of what the shell does. Turn on with `?jetpack_admin_shell_debug=1` (remembered
 * in localStorage) and off with `?jetpack_admin_shell_debug=0`.
 */

const KEY = 'jetpack-admin-shell-debug';

const readEnabled = () => {
	try {
		const param = new URL( location.href ).searchParams.get( 'jetpack_admin_shell_debug' );
		if ( param !== null ) {
			if ( param === '0' ) {
				localStorage.removeItem( KEY );
			} else {
				localStorage.setItem( KEY, '1' );
			}
		}
		return localStorage.getItem( KEY ) === '1';
	} catch {
		return false;
	}
};

export const debugEnabled = readEnabled();

const COLORS = {
	shell: '#3858e9',
	host: '#008710',
	prewarm: '#b26200',
	switch: '#cc1818',
	router: '#7a00df',
	header: '#00739c',
};

/**
 * Log one step, stamped with the time since the page load started.
 *
 * @param {string} area    - Part of the shell, picks the colour: shell, host, prewarm, switch, router, header.
 * @param {string} message - What happened.
 * @param {...*}   details - Anything worth expanding in the console.
 */
export function log( area, message, ...details ) {
	if ( ! debugEnabled ) {
		return;
	}
	// eslint-disable-next-line no-console -- Opt-in trace.
	console.log(
		`%cadmin-shell%c ${ area } %c+${ Math.round( performance.now() ) }ms%c ${ message }`,
		'background:#1e1e1e;color:#fff;padding:1px 4px;border-radius:2px',
		`color:${ COLORS[ area ] ?? 'inherit' };font-weight:600`,
		'color:#757575',
		'',
		...details
	);
}

/**
 * Start a stopwatch.
 *
 * @return {Function} Returns the milliseconds elapsed, as a `123ms` string.
 */
export function stopwatch() {
	const start = performance.now();
	return () => `${ Math.round( performance.now() - start ) }ms`;
}
