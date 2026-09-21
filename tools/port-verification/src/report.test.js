import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffSnapshots } from './diff.js';
import {
	flagOffSnapshot,
	flagOnSnapshot,
	flagOnSnapshotWith404,
	flagOnSnapshotWithGeometryShift,
} from './fixtures.js';
import { formatReport } from './report.js';

describe( 'formatReport', () => {
	it( 'includes the page, flag and capture timestamps in the header', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshot() ), {
			url: 'https://example.jurassic.ninja/wp-admin/admin.php?page=jetpack',
			flag: 'rsm_jetpack_ui_modernization_x',
			beforeCapturedAt: '2026-09-21T12:00:00.000Z',
			afterCapturedAt: '2026-09-21T12:03:00.000Z',
		} );
		assert.match( report, /admin\.php\?page=jetpack/ );
		assert.match( report, /rsm_jetpack_ui_modernization_x/ );
		assert.match( report, /2026-09-21T12:00:00\.000Z/ );
		assert.match( report, /2026-09-21T12:03:00\.000Z/ );
	} );

	it( 'lists every geometry target as a table row, including the accepted root inset', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshot() ), {
			url: 'x',
		} );
		assert.match( report, /\| Page root \(#wpwrap\) \| CHANGED \|/ );
		assert.match( report, /\| #wpbody-content \| OK \|/ );
		assert.match( report, /\| Header \(#wpadminbar\) \| OK \|/ );
		assert.match( report, /\| Footer \(#wpfooter\) \| OK \|/ );
		assert.match( report, /\| Control \| OK \|/ );
	} );

	it( 'surfaces a geometry regression as a CHANGED row with the pixel delta', () => {
		const report = formatReport(
			diffSnapshots( flagOffSnapshot(), flagOnSnapshotWithGeometryShift() ),
			{ url: 'x' }
		);
		assert.match( report, /\| #wpbody-content \| CHANGED \| width: 1120px -> 1132px/ );
	} );

	it( 'surfaces a network-only request in step 3', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshotWith404() ), {
			url: 'x',
		} );
		assert.match( report, /Only with flag on \(1\):/ );
		assert.match( report, /design-tokens\.css` -> 404/ );
	} );

	it( 'prints "none" for an empty network bucket', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshot() ), {
			url: 'x',
		} );
		assert.match( report, /Only with flag off \(0\):\n {2}- none/ );
	} );

	it( 'summary counts findings, excluding the missing-but-optional control', () => {
		const before = { geometry: {}, network: [] };
		const after = { geometry: {}, network: [] };
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match( report, /0 geometry finding\(s\), 0 network finding\(s\)\./ );
	} );

	it( 'escalates a required target missing from one side to a geometry finding', () => {
		const before = {
			geometry: { header: { label: 'Header (#wpadminbar)', rect: { width: 10 }, style: {} } },
			network: [],
		};
		const after = { geometry: {}, network: [] };
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match( report, /\| Header \(#wpadminbar\) \| MISSING \|/ );
		assert.match( report, /1 geometry finding\(s\)/ );
	} );

	it( 'treats a control missing on one side as optional, not a finding', () => {
		const before = {
			geometry: { control: { label: 'Control', rect: { width: 10 }, style: {} } },
			network: [],
		};
		const after = { geometry: {}, network: [] };
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match( report, /\| Control \| ok \(not present, optional\) \|/ );
		assert.match( report, /0 geometry finding\(s\)/ );
	} );
} );
