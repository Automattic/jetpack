import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffGeometry, diffNetwork, diffSnapshots, normalizeRequestKey } from './diff.js';
import {
	flagOffSnapshot,
	flagOnSnapshot,
	flagOnSnapshotWith404,
	flagOnSnapshotWithGeometryShift,
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

	it( 'falls back to a raw compare for a non-absolute URL', () => {
		assert.equal(
			normalizeRequestKey( { url: '/relative/path', method: 'GET' } ),
			'GET /relative/path'
		);
	} );
} );

describe( 'diffNetwork', () => {
	it( 'finds no differences for identical request lists', () => {
		const requests = [ { url: 'https://site.test/a.js', method: 'GET', status: 200 } ];
		const result = diffNetwork( requests, requests );
		assert.deepEqual( result, { onlyBefore: [], onlyAfter: [], statusChanged: [] } );
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
		assert.equal( result.statusChanged[ 0 ].before.status, 200 );
		assert.equal( result.statusChanged[ 0 ].after.status, 500 );
	} );

	it( 'catches a request that disappears after the flag flips', () => {
		const before = [ { url: 'https://site.test/legacy.js', method: 'GET', status: 200 } ];
		const after = [];
		const result = diffNetwork( before, after );
		assert.equal( result.onlyBefore.length, 1 );
	} );
} );

describe( 'diffSnapshots (fixtures)', () => {
	it( 'a clean port reports no geometry or network findings beyond the accepted root inset', () => {
		const { geometry, network } = diffSnapshots( flagOffSnapshot(), flagOnSnapshot() );
		const nonRootFindings = geometry.filter( g => g.key !== 'root' && g.status !== 'ok' );
		assert.deepEqual( nonRootFindings, [] );
		assert.deepEqual( network.onlyBefore, [] );
		assert.deepEqual( network.onlyAfter, [] );
		assert.deepEqual( network.statusChanged, [] );

		const root = geometry.find( g => g.key === 'root' );
		assert.equal( root.status, 'changed' );
		assert.match( root.details.join( ' ' ), /x: 0px -> 8px/ );
	} );

	it( 'flags the pilot-style design-tokens.css 404 as a network-only finding', () => {
		const { network } = diffSnapshots( flagOffSnapshot(), flagOnSnapshotWith404() );
		assert.equal( network.onlyAfter.length, 1 );
		assert.match( network.onlyAfter[ 0 ].url, /design-tokens\.css/ );
		assert.equal( network.onlyAfter[ 0 ].status, 404 );
	} );

	it( 'flags a #wpbody-content geometry shift beyond tolerance', () => {
		const { geometry } = diffSnapshots( flagOffSnapshot(), flagOnSnapshotWithGeometryShift() );
		const finding = geometry.find( g => g.key === 'wpbodyContent' );
		assert.equal( finding.status, 'changed' );
		assert.match( finding.details.join( ' ' ), /width: 1120px -> 1132px \(Δ12\.0px\)/ );
	} );
} );
