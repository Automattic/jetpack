import { parseVisits } from './visits';
import './style.scss';

const WIDTH = 88;
const HEIGHT = 20;
const STROKE_WIDTH = 1.5;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch daily views and visitors, reusing a copy from the last few minutes so moving between pages doesn't refetch.
 *
 * @param {string} url   - The visits endpoint, with its query string.
 * @param {string} nonce - The REST API nonce.
 * @return {Promise<{views: number[], visitors: number[]}>} Daily values, oldest first.
 */
async function fetchVisits( url, nonce ) {
	const cacheKey = `jetpack-stats-admin-bar:${ url }`;
	try {
		const cached = JSON.parse( window.sessionStorage.getItem( cacheKey ) );
		if ( cached && Date.now() - cached.time < CACHE_TTL ) {
			return cached.visits;
		}
	} catch {
		// Storage can be unavailable or hold something unreadable; fetch instead.
	}

	const response = await fetch( url, {
		credentials: 'same-origin',
		headers: { 'X-WP-Nonce': nonce },
	} );
	if ( ! response.ok ) {
		throw new Error( response.statusText );
	}

	const visits = parseVisits( await response.json() );
	try {
		window.sessionStorage.setItem( cacheKey, JSON.stringify( { time: Date.now(), visits } ) );
	} catch {
		// Without storage the next page fetches again.
	}
	return visits;
}

/**
 * Make a number formatter for the page's language, falling back to the browser's when the page's isn't valid.
 *
 * @param {object} options - Intl.NumberFormat options.
 * @return {Function} The formatter.
 */
function numberFormatter( options ) {
	try {
		return new Intl.NumberFormat( document.documentElement.lang || undefined, options ).format;
	} catch {
		return new Intl.NumberFormat( undefined, options ).format;
	}
}

/**
 * Build the path of a monotone cubic curve through evenly spaced points, so it never overshoots them.
 *
 * @param {number[]} ys - The y of each point.
 * @param {number}   h  - The horizontal distance between points.
 * @return {string} The path data.
 */
function monotonePath( ys, h ) {
	const n = ys.length;
	const secants = ys.slice( 1 ).map( ( y, i ) => ( y - ys[ i ] ) / h );
	const tangents = ys.map( ( _, i ) => {
		if ( i === 0 || i === n - 1 ) {
			return 0;
		}
		const [ s0, s1 ] = [ secants[ i - 1 ], secants[ i ] ];
		return (
			( Math.sign( s0 ) + Math.sign( s1 ) ) *
				Math.min( Math.abs( s0 ), Math.abs( s1 ), Math.abs( s0 + s1 ) / 4 ) || 0
		);
	} );
	tangents[ 0 ] = ( 3 * secants[ 0 ] - tangents[ 1 ] ) / 2;
	tangents[ n - 1 ] = ( 3 * secants[ n - 2 ] - tangents[ n - 2 ] ) / 2;

	const round = value => Math.round( value * 100 ) / 100;
	let d = `M0,${ round( ys[ 0 ] ) }`;
	for ( let i = 1; i < n; i++ ) {
		const x0 = ( i - 1 ) * h;
		d += `C${ round( x0 + h / 3 ) },${ round( ys[ i - 1 ] + ( tangents[ i - 1 ] * h ) / 3 ) },${ round(
			x0 + ( 2 * h ) / 3
		) },${ round( ys[ i ] - ( tangents[ i ] * h ) / 3 ) },${ round( x0 + h ) },${ round( ys[ i ] ) }`;
	}
	return d;
}

/**
 * Draw the admin bar sparkline: a line with a fading fill under it, in the link's text color.
 *
 * @param {HTMLElement} el     - Where the sparkline renders.
 * @param {number[]}    values - Daily values, oldest first.
 */
function drawSparkline( el, values ) {
	if ( values.length < 2 ) {
		return;
	}

	const min = Math.min( ...values );
	const range = Math.max( ...values ) - min || 1;
	const inset = STROKE_WIDTH / 2;
	const ys = values.map(
		value => inset + ( 1 - ( value - min ) / range ) * ( HEIGHT - STROKE_WIDTH )
	);
	const line = monotonePath( ys, WIDTH / ( values.length - 1 ) );

	el.innerHTML = `<svg width="${ WIDTH }" height="${ HEIGHT }" viewBox="0 0 ${ WIDTH } ${ HEIGHT }" focusable="false">
		<defs><linearGradient id="jp-stats-admin-bar-fill" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="currentColor" stop-opacity="0.5"/>
			<stop offset="1" stop-color="currentColor" stop-opacity="0"/>
		</linearGradient></defs>
		<path d="${ line }L${ WIDTH },${ HEIGHT }L0,${ HEIGHT }Z" fill="url(#jp-stats-admin-bar-fill)"/>
		<path d="${ line }" fill="none" stroke="currentColor" stroke-width="${ STROKE_WIDTH }" stroke-linecap="round"/>
	</svg>`;
}

/**
 * Draw daily values as a row of bars, scaled to the busiest day.
 *
 * @param {HTMLElement} el     - The bars container.
 * @param {number[]}    values - Daily values, oldest first.
 */
function drawBars( el, values ) {
	const max = Math.max( ...values, 1 );
	el.replaceChildren(
		...values.map( ( value, index ) => {
			const bar = document.createElement( 'span' );
			bar.className = 'jp-stats-admin-bar-panel__bar';
			bar.style.blockSize = `${ Math.max( ( value / max ) * 100, 4 ) }%`;
			bar.style.setProperty( '--jp-stats-bar-index', index );
			return bar;
		} )
	);
}

/**
 * Fetch stats and fill in the sparkline and the hover panel.
 */
function init() {
	const chartEl = document.getElementById( 'jetpack-stats-admin-bar-chart' );
	const panelEl = document.getElementById( 'jetpack-stats-admin-bar-panel' );
	const { restUrl, nonce } = window.jetpackStatsAdminBar ?? {};

	if ( ! chartEl || ! panelEl || ! restUrl ) {
		return;
	}

	fetchVisits( restUrl, nonce )
		.then( ( { views, visitors } ) => {
			// Shortened like Stats does: 999, then 1K, 1.2K, 13.8M.
			const formatCompact = numberFormatter( { notation: 'compact', maximumFractionDigits: 1 } );
			const format = numberFormatter();
			const sum = values => values.reduce( ( total, value ) => total + value, 0 );
			const showMetric = ( name, values ) => {
				const el = panelEl.querySelector( `[data-metric="${ name }"]` );
				el.textContent = formatCompact( sum( values ) );
				el.title = format( sum( values ) );
			};

			drawSparkline( chartEl, views );
			drawBars( panelEl.querySelector( '.jp-stats-admin-bar-panel__bars' ), views );
			showMetric( 'views', views );
			showMetric( 'visitors', visitors );
		} )
		.catch( () => {
			panelEl.querySelector( '.jp-stats-admin-bar-panel__bars' ).hidden = true;
			panelEl.querySelector( '.jp-stats-admin-bar-panel__metrics' ).hidden = true;
			panelEl.querySelector( '.jp-stats-admin-bar-panel__error' ).hidden = false;
		} );
}

// Themes without wp_body_open get the admin bar printed after footer scripts, so wait for it.
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
