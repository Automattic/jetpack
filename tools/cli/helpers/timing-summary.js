import formatDuration from './format-duration.js';

const DASH = '—';

/**
 * Aggregate the flat list of timing entries into per-project phase totals.
 *
 * @param {object} timings - The `ctx.timings` object ({ overallStart, entries, buildOrder }).
 * @return {object} `{ rows, sumOfTotals }` where `rows` is a Map of project => { install, build, task, other, shared, ok }.
 */
function aggregate( timings ) {
	const buildOrder = new Set( timings.buildOrder );
	const rows = new Map();
	let sumOfTotals = 0;

	for ( const e of timings.entries ) {
		let row = rows.get( e.project );
		if ( ! row ) {
			row = {
				project: e.project,
				install: null,
				build: null,
				task: null,
				shared: ! buildOrder.has( e.project ),
				ok: true,
			};
			rows.set( e.project, row );
		}
		if ( e.phase === '_task' ) {
			row.task = ( row.task || 0 ) + e.duration;
		} else {
			row[ e.phase ] = ( row[ e.phase ] || 0 ) + e.duration;
		}
		if ( ! e.ok ) {
			row.ok = false;
		}
	}

	for ( const row of rows.values() ) {
		const task = row.task || 0;
		sumOfTotals += task;
		// Shared tasks (pnpm/changelogger install) have no install/build phase of their own; their
		// whole total is install work, so surface it in the Install column rather than "Other".
		if ( row.shared ) {
			row.install = task;
			row.other = null;
		} else {
			// "Other" is whatever wasn't explicitly timed as install/build (changelog, mirroring, overhead).
			row.other = Math.max( 0, task - ( row.install || 0 ) - ( row.build || 0 ) );
		}
	}

	return { rows, sumOfTotals };
}

/**
 * Print a human-readable phase-level timing summary table.
 *
 * Shared/top-level tasks (e.g. `pnpm install`) are listed first, then build projects in build
 * order. Phases that never ran (skipped install, no build script) render as an em dash.
 *
 * @param {object} ctx  - Build context. Uses `ctx.timings`.
 * @param {object} argv - Command line arguments. Uses `argv.concurrency`.
 */
export function printTimingSummary( ctx, argv ) {
	if ( ! ctx.timings || ctx.timings.entries.length === 0 ) {
		return;
	}

	const { rows, sumOfTotals } = aggregate( ctx.timings );
	const wallClock = Date.now() - ctx.timings.overallStart;
	const order = [ ...ctx.timings.buildOrder ];

	// Shared rows first (in encounter order), then build rows in build order.
	const sorted = [ ...rows.values() ]
		.filter( r => r.shared )
		.concat( order.map( p => rows.get( p ) ).filter( Boolean ) );

	const fmt = ms => ( ms === null || ms === undefined ? DASH : formatDuration( ms ) + 's' );

	const cols = [
		{ label: 'Project', get: r => r.project, align: 'left' },
		{ label: 'Install', get: r => fmt( r.install ), align: 'right' },
		{ label: 'Build', get: r => fmt( r.build ), align: 'right' },
		{ label: 'Other', get: r => fmt( r.other ), align: 'right' },
		{ label: 'Total', get: r => fmt( r.task ), align: 'right' },
	];

	// Compute each column's width from its header and all cell values.
	const widths = cols.map( c =>
		Math.max( c.label.length, ...sorted.map( r => c.get( r ).length ) )
	);

	const pad = ( s, i ) =>
		cols[ i ].align === 'right' ? s.padStart( widths[ i ] ) : s.padEnd( widths[ i ] );

	const renderRow = cells => '  ' + cells.map( ( s, i ) => pad( s, i ) ).join( '   ' );

	const header = renderRow( cols.map( c => c.label ) );
	const sep = '  ' + '─'.repeat( header.length - 2 );
	const concurrency = Number.isFinite( argv.concurrency ) ? argv.concurrency : 'unlimited';

	const lines = [
		'',
		`Timing summary (concurrency: ${ concurrency })`,
		'',
		header,
		sep,
		...sorted.map( r => renderRow( cols.map( c => c.get( r ) ) ) ),
		sep,
	];

	// Footers: align the value under the Total column.
	const labelWidth = widths.slice( 0, -1 ).reduce( ( a, w ) => a + w, 0 ) + 3 * ( cols.length - 1 );
	const footer = ( label, ms ) =>
		'  ' + label.padEnd( labelWidth ) + ( formatDuration( ms ) + 's' ).padStart( widths.at( -1 ) );
	lines.push( footer( 'Sum of per-project totals', sumOfTotals ) );
	lines.push( footer( 'Wall-clock (overall)', wallClock ) );

	console.log( lines.join( '\n' ) );
}

/**
 * Build a machine-readable timing report suitable for JSON serialization.
 *
 * The `projects` and `shared` maps are aggregated views derived from `raw`, which is the
 * unaggregated list of phase entries. Consumers wanting per-phase totals should read
 * `projects`/`shared`; `raw` is for ad-hoc analysis of the individual timings.
 *
 * @param {object} ctx  - Build context. Uses `ctx.timings`.
 * @param {object} argv - Command line arguments.
 * @return {object} The timing report.
 */
export function buildTimingJson( ctx, argv ) {
	const { rows, sumOfTotals } = aggregate( ctx.timings );
	const finishedMs = Date.now();
	const wallClockMs = finishedMs - ctx.timings.overallStart;

	const projects = {};
	const shared = {};
	for ( const r of rows.values() ) {
		if ( r.shared ) {
			shared[ r.project ] = { totalMs: r.task ?? null, ok: r.ok };
		} else {
			projects[ r.project ] = {
				installMs: r.install ?? null,
				buildMs: r.build ?? null,
				otherMs: r.other,
				totalMs: r.task ?? null,
				ok: r.ok,
			};
		}
	}

	return {
		version: 1,
		command: 'build',
		startedAt: new Date( ctx.timings.overallStart ).toISOString(),
		finishedAt: new Date( finishedMs ).toISOString(),
		wallClockMs,
		sumOfProjectTotalsMs: sumOfTotals,
		concurrency: Number.isFinite( argv.concurrency ) ? argv.concurrency : 'unlimited',
		production: !! argv.production,
		forMirrors: !! argv.forMirrors,
		projects,
		shared,
		raw: ctx.timings.entries,
	};
}
