import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	diffGeometry,
	diffNetwork,
	diffSnapshots,
	normalizeRequestKey,
	redactUrl,
} from './diff.js';
import {
	flagOffSnapshot,
	flagOnSnapshot,
	flagOnSnapshotWith404,
	flagOnSnapshotWithGeometryShift,
	flagOnSnapshotWithRetried404,
	flagOnSnapshotWithUnexpectedlyHiddenHeader,
} from './fixtures.js';

describe( 'diffGeometry', () => {
	it( 'reports ok for identical targets', () => {
		const before = {
			wpbodyContent: { label: 'x', rect: { width: 100 }, style: { fontFamily: 'Arial' } },
		};
		const after = {
			wpbodyContent: { label: 'x', rect: { width: 100 }, style: { fontFamily: 'Arial' } },
		};
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'ok' );
		assert.deepEqual( result.details, [] );
	} );

	it( 'ignores a rect delta within tolerance', () => {
		const before = { wpbodyContent: { label: 'x', rect: { width: 100 } } };
		const after = { wpbodyContent: { label: 'x', rect: { width: 100.3 } } };
		const [ result ] = diffGeometry( before, after, { tolerancePx: 0.5 } );
		assert.equal( result.status, 'ok' );
	} );

	it( 'flags a rect delta beyond tolerance', () => {
		const before = { wpbodyContent: { label: 'x', rect: { width: 100 } } };
		const after = { wpbodyContent: { label: 'x', rect: { width: 104 } } };
		const [ result ] = diffGeometry( before, after, { tolerancePx: 0.5 } );
		assert.equal( result.status, 'changed' );
		assert.match( result.details[ 0 ], /width: 100px -> 104px \(Δ4\.0px\)/ );
	} );

	it( 'flags a font-family change as a string diff', () => {
		const before = { header: { label: 'Header', rect: {}, style: { fontFamily: 'Arial' } } };
		const after = { header: { label: 'Header', rect: {}, style: { fontFamily: 'Helvetica' } } };
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'changed' );
		assert.match( result.details[ 0 ], /fontFamily/ );
	} );

	it( 'flags a control box-model prop that moved beyond tolerance', () => {
		const before = {
			control: { label: 'Control', rect: { width: 100 }, style: { paddingTop: 6 } },
		};
		const after = {
			control: { label: 'Control', rect: { width: 100 }, style: { paddingTop: 10 } },
		};
		const [ result ] = diffGeometry( before, after, { tolerancePx: 0.5 } );
		assert.equal( result.status, 'changed' );
		assert.match( result.details[ 0 ], /paddingTop: 6px -> 10px/ );
	} );

	it( 'marks a target present only on one side as missing', () => {
		const before = { control: { label: 'Control', rect: {}, style: {} } };
		const after = {};
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'missing' );
		assert.equal( result.after, null );
	} );

	it( 'skips a target absent from both snapshots', () => {
		const results = diffGeometry( {}, {} );
		assert.deepEqual( results, [] );
	} );

	it( 'reports a visible-to-hidden transition as hidden-changed, not a bogus zero-rect delta', () => {
		const before = {
			footer: { label: 'Footer', hidden: false, rect: { x: 160, y: 880, width: 1120, height: 20 } },
		};
		const after = {
			footer: { label: 'Footer', hidden: true, rect: { x: 0, y: 0, width: 0, height: 0 } },
		};
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'hidden-changed' );
		assert.deepEqual( result.details, [ 'visibility: visible -> hidden' ] );
	} );

	it( 'reports a hidden-to-visible transition the other direction', () => {
		const before = {
			footer: { label: 'Footer', hidden: true, rect: { x: 0, y: 0, width: 0, height: 0 } },
		};
		const after = {
			footer: { label: 'Footer', hidden: false, rect: { x: 160, y: 880, width: 1120, height: 20 } },
		};
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'hidden-changed' );
		assert.deepEqual( result.details, [ 'visibility: hidden -> visible' ] );
	} );

	it( 'reports ok, not a finding, when a target is hidden on both sides', () => {
		const before = {
			footer: { label: 'Footer', hidden: true, rect: { x: 0, y: 0, width: 0, height: 0 } },
		};
		const after = {
			footer: { label: 'Footer', hidden: true, rect: { x: 0, y: 0, width: 0, height: 0 } },
		};
		const [ result ] = diffGeometry( before, after );
		assert.equal( result.status, 'ok' );
	} );
} );

describe( 'normalizeRequestKey', () => {
	it( 'strips ignored query params so two loads with different nonces still match', () => {
		const a = { url: 'https://site.test/wp-json/x?_wpnonce=aaa&foo=1', method: 'GET' };
		const b = { url: 'https://site.test/wp-json/x?_wpnonce=bbb&foo=1', method: 'GET' };
		assert.equal( normalizeRequestKey( a ), normalizeRequestKey( b ) );
	} );

	it( 'keeps params that were not marked as ignorable', () => {
		const a = { url: 'https://site.test/wp-json/x?foo=1', method: 'GET' };
		const b = { url: 'https://site.test/wp-json/x?foo=2', method: 'GET' };
		assert.notEqual( normalizeRequestKey( a ), normalizeRequestKey( b ) );
	} );

	it( "does not ignore 'v' or 't' by default -- generic enough to carry real state (an API version, a tab)", () => {
		const v1 = { url: 'https://site.test/wp-json/x?v=1', method: 'GET' };
		const v2 = { url: 'https://site.test/wp-json/x?v=2', method: 'GET' };
		assert.notEqual( normalizeRequestKey( v1 ), normalizeRequestKey( v2 ) );

		const t1 = { url: 'https://site.test/wp-json/x?t=inbox', method: 'GET' };
		const t2 = { url: 'https://site.test/wp-json/x?t=sent', method: 'GET' };
		assert.notEqual( normalizeRequestKey( t1 ), normalizeRequestKey( t2 ) );
	} );

	it( 'ignores an extra param only when the caller opts in via ignoreQueryParams', () => {
		const a = { url: 'https://site.test/wp-json/x?v=1', method: 'GET' };
		const b = { url: 'https://site.test/wp-json/x?v=2', method: 'GET' };
		const options = { ignoreQueryParams: [ 'v' ] };
		assert.equal( normalizeRequestKey( a, options ), normalizeRequestKey( b, options ) );
	} );

	it( 'strips _ajax_nonce too -- admin-ajax.php carries its nonce under that name', () => {
		const a = {
			url: 'https://site.test/wp-admin/admin-ajax.php?action=x&_ajax_nonce=aaa',
			method: 'POST',
		};
		const b = {
			url: 'https://site.test/wp-admin/admin-ajax.php?action=x&_ajax_nonce=bbb',
			method: 'POST',
		};
		assert.equal( normalizeRequestKey( a ), normalizeRequestKey( b ) );
	} );

	it( 'falls back to a raw compare for a non-absolute URL', () => {
		assert.equal(
			normalizeRequestKey( { url: '/relative/path', method: 'GET' } ),
			'GET /relative/path'
		);
	} );
} );

describe( 'redactUrl', () => {
	it( 'strips a nonce from a URL before it would be shown in a report', () => {
		const redacted = redactUrl( 'https://site.test/wp-json/x?_wpnonce=deadbeef1234&foo=1' );
		assert.ok( ! redacted.includes( 'deadbeef1234' ) );
		assert.ok( redacted.includes( 'foo=1' ) );
	} );

	it( 'strips an _ajax_nonce value as well', () => {
		const redacted = redactUrl(
			'https://site.test/wp-admin/admin-ajax.php?action=x&_ajax_nonce=cafebabe5678'
		);
		assert.ok( ! redacted.includes( 'cafebabe5678' ) );
		assert.ok( redacted.includes( 'action=x' ) );
	} );

	it( 'keeps a param that was not marked as ignorable', () => {
		const redacted = redactUrl( 'https://site.test/wp-json/x?type=post' );
		assert.ok( redacted.includes( 'type=post' ) );
	} );

	it( 'returns a non-absolute URL unchanged', () => {
		assert.equal( redactUrl( '/relative/path?_wpnonce=aaa' ), '/relative/path?_wpnonce=aaa' );
	} );
} );

describe( 'diffNetwork', () => {
	it( 'finds no differences for identical request lists', () => {
		const requests = [ { url: 'https://site.test/a.js', method: 'GET', status: 200 } ];
		const result = diffNetwork( requests, requests );
		assert.deepEqual( result, {
			onlyBefore: [],
			onlyAfter: [],
			statusChanged: [],
			countChanged: [],
		} );
	} );

	it( 'catches a request that only fires after the flag flips (the design-tokens.css 404 case)', () => {
		const before = [ { url: 'https://site.test/a.js', method: 'GET', status: 200 } ];
		const after = [
			{ url: 'https://site.test/a.js', method: 'GET', status: 200 },
			{ url: 'https://site.test/design-tokens.css', method: 'GET', status: 404 },
		];
		const result = diffNetwork( before, after );
		assert.equal( result.onlyAfter.length, 1 );
		assert.equal( result.onlyAfter[ 0 ].status, 404 );
		assert.equal( result.onlyBefore.length, 0 );
	} );

	it( 'catches a status code change on the same request', () => {
		const before = [ { url: 'https://site.test/a.js', method: 'GET', status: 200 } ];
		const after = [ { url: 'https://site.test/a.js', method: 'GET', status: 500 } ];
		const result = diffNetwork( before, after );
		assert.equal( result.statusChanged.length, 1 );
		assert.deepEqual( result.statusChanged[ 0 ].beforeStatuses, [ 200 ] );
		assert.deepEqual( result.statusChanged[ 0 ].afterStatuses, [ 500 ] );
	} );

	it( 'does not let a later 200 on the same path hide an earlier 404', () => {
		const url = 'https://site.test/design-tokens.css';
		const before = [ { url, method: 'GET', status: 200 } ];
		const after = [
			{ url, method: 'GET', status: 404 },
			{ url, method: 'GET', status: 200 },
		];
		const result = diffNetwork( before, after );
		assert.equal( result.statusChanged.length, 1 );
		assert.deepEqual( result.statusChanged[ 0 ].beforeStatuses, [ 200 ] );
		assert.deepEqual( result.statusChanged[ 0 ].afterStatuses, [ 200, 404 ] );
	} );

	it( 'reports a request that fires a different number of times', () => {
		const url = 'https://site.test/wp-json/jetpack/v4/settings';
		const before = [ 1, 2, 3 ].map( () => ( { url, method: 'GET', status: 200 } ) );
		const after = [ { url, method: 'GET', status: 200 } ];
		const result = diffNetwork( before, after );
		assert.deepEqual( result.countChanged, [
			{ key: 'GET /wp-json/jetpack/v4/settings', beforeCount: 3, afterCount: 1 },
		] );
		assert.equal( result.statusChanged.length, 0 );
	} );

	it( 'counts repeats of a request that fires on one side only', () => {
		const url = 'https://site.test/legacy.js';
		const before = [
			{ url, method: 'GET', status: 200 },
			{ url, method: 'GET', status: 200 },
		];
		const result = diffNetwork( before, [] );
		assert.equal( result.onlyBefore.length, 1 );
		assert.equal( result.onlyBefore[ 0 ].count, 2 );
	} );

	it( 'catches a request that disappears after the flag flips', () => {
		const before = [ { url: 'https://site.test/legacy.js', method: 'GET', status: 200 } ];
		const after = [];
		const result = diffNetwork( before, after );
		assert.equal( result.onlyBefore.length, 1 );
	} );
} );

describe( 'diffSnapshots (fixtures)', () => {
	it( 'a clean port reports no geometry or network findings beyond the accepted root inset and the footer going hidden', () => {
		const { geometry, network } = diffSnapshots( flagOffSnapshot(), flagOnSnapshot() );
		const otherFindings = geometry.filter(
			g => g.key !== 'root' && g.key !== 'footer' && g.status !== 'ok'
		);
		assert.deepEqual( otherFindings, [] );
		assert.deepEqual( network.onlyBefore, [] );
		assert.deepEqual( network.onlyAfter, [] );
		assert.deepEqual( network.statusChanged, [] );
		assert.deepEqual( network.countChanged, [] );

		const root = geometry.find( g => g.key === 'root' );
		assert.equal( root.status, 'changed' );
		assert.match( root.details.join( ' ' ), /x: 0px -> 8px/ );

		// #wpfooter goes display:none by design (see fixtures.js) -- a raw hidden-changed fact
		// at this pure-diff level; report.js's allowHidden config is what excludes it from
		// counting as a finding for a reviewer.
		const footer = geometry.find( g => g.key === 'footer' );
		assert.equal( footer.status, 'hidden-changed' );
		assert.deepEqual( footer.details, [ 'visibility: visible -> hidden' ] );
	} );

	it( 'flags the pilot-style design-tokens.css 404 as a network-only finding, with the nonce stripped from the match', () => {
		const { network } = diffSnapshots( flagOffSnapshot(), flagOnSnapshotWith404() );
		assert.equal( network.onlyAfter.length, 1 );
		assert.match( network.onlyAfter[ 0 ].url, /design-tokens\.css/ );
		assert.equal( network.onlyAfter[ 0 ].status, 404 );
	} );

	it( 'still flags the 404 when the same path is refetched successfully right after', () => {
		const { network } = diffSnapshots( flagOffSnapshot(), flagOnSnapshotWithRetried404() );
		assert.equal( network.onlyAfter.length, 1 );
		assert.match( network.onlyAfter[ 0 ].url, /design-tokens\.css/ );
		assert.equal( network.onlyAfter[ 0 ].count, 2 );
	} );

	it( 'flags a #wpbody-content geometry shift beyond tolerance', () => {
		const { geometry } = diffSnapshots( flagOffSnapshot(), flagOnSnapshotWithGeometryShift() );
		const finding = geometry.find( g => g.key === 'wpbodyContent' );
		assert.equal( finding.status, 'changed' );
		assert.match( finding.details.join( ' ' ), /width: 1120px -> 1132px \(Δ12\.0px\)/ );
	} );

	it( 'flags an unexpectedly hidden header as hidden-changed (raw diff fact, regardless of allowHidden policy)', () => {
		const { geometry } = diffSnapshots(
			flagOffSnapshot(),
			flagOnSnapshotWithUnexpectedlyHiddenHeader()
		);
		const finding = geometry.find( g => g.key === 'header' );
		assert.equal( finding.status, 'hidden-changed' );
		assert.deepEqual( finding.details, [ 'visibility: visible -> hidden' ] );
	} );
} );
