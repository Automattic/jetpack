import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffSnapshots } from './diff.js';
import {
	flagOffSnapshot,
	flagOnSnapshot,
	flagOnSnapshotWith404,
	flagOnSnapshotWithGeometryShift,
	flagOnSnapshotWithRetried404,
	flagOnSnapshotWithUnexpectedlyHiddenHeader,
} from './fixtures.js';
import { formatReport } from './report.js';
import { DEFAULT_GEOMETRY_TARGETS } from './selectors.js';

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
		assert.match( report, /\| Control \| OK \|/ );
	} );

	it( 'renders the footer going hidden by design as OK, not a bogus geometry CHANGED row', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshot() ), {
			url: 'x',
		} );
		assert.match(
			report,
			/\| Footer \(#wpfooter\) \| OK \(hidden by design\) \| visibility: visible -> hidden \|/
		);
		assert.doesNotMatch( report, /Footer \(#wpfooter\) \| CHANGED/ );
		assert.doesNotMatch( report, /width: 1120px -> 0px/ );
	} );

	it( 'counts an unexpectedly hidden header (no allowHidden) as a geometry finding, unlike the footer', () => {
		const report = formatReport(
			diffSnapshots( flagOffSnapshot(), flagOnSnapshotWithUnexpectedlyHiddenHeader() ),
			{ url: 'x' }
		);
		assert.match(
			report,
			/\| Header \(#wpadminbar\) \| CHANGED \| visibility: visible -> hidden \|/
		);
		// root's accepted 8px inset (1) + the unexpected header hidden-change (1) = 2.
		assert.match( report, /2 geometry finding\(s\)/ );
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

	it( 'never prints a nonce value from a network URL -- this report is pasted into a public PR', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshotWith404() ), {
			url: 'x',
		} );
		assert.ok( ! report.includes( 'deadbeef1234' ) );
		assert.match( report, /design-tokens\.css` -> 404/ );
	} );

	it( 'prints "none" for an empty network bucket', () => {
		const report = formatReport( diffSnapshots( flagOffSnapshot(), flagOnSnapshot() ), {
			url: 'x',
		} );
		assert.match( report, /Only with flag off \(0\):\n {2}- none/ );
	} );

	it( 'summary counts nothing when the only configured target is the optional control', () => {
		const before = { geometry: {}, network: [] };
		const after = { geometry: {}, network: [] };
		const report = formatReport(
			diffSnapshots( before, after ),
			{ url: 'x' },
			{
				control: DEFAULT_GEOMETRY_TARGETS.control,
			}
		);
		assert.match( report, /0 geometry finding\(s\), 0 network finding\(s\)\./ );
	} );

	it( 'escalates a required target missing from one side to a geometry finding', () => {
		const before = {
			geometry: { header: { label: 'Header (#wpadminbar)', rect: { width: 10 }, style: {} } },
			network: [],
		};
		const after = { geometry: {}, network: [] };
		const report = formatReport(
			diffSnapshots( before, after ),
			{ url: 'x' },
			{
				header: DEFAULT_GEOMETRY_TARGETS.header,
			}
		);
		assert.match( report, /\| Header \(#wpadminbar\) \| MISSING \|/ );
		assert.match( report, /1 geometry finding\(s\)/ );
	} );

	it( 'treats a control missing on one side as optional, not a finding', () => {
		const before = {
			geometry: { control: { label: 'Control', rect: { width: 10 }, style: {} } },
			network: [],
		};
		const after = { geometry: {}, network: [] };
		const report = formatReport(
			diffSnapshots( before, after ),
			{ url: 'x' },
			{
				control: DEFAULT_GEOMETRY_TARGETS.control,
			}
		);
		assert.match( report, /\| Control \| ok \(not present, optional\) \|/ );
		assert.match( report, /0 geometry finding\(s\)/ );
	} );

	it( 'says the control was skipped rather than leaving its row out', () => {
		const before = flagOffSnapshot();
		const after = flagOnSnapshot();
		delete before.geometry.control;
		delete after.geometry.control;
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match(
			report,
			/\| Control \| skipped \(optional\) \| no selector given \(--control-selector\) \|/
		);
		// Only root's accepted inset; a skipped optional target is not a finding.
		assert.match( report, /1 geometry finding\(s\)/ );
	} );

	it( 'counts a required target that matched in neither capture as NOT MEASURED', () => {
		const before = flagOffSnapshot();
		const after = flagOnSnapshot();
		delete before.geometry.header;
		delete after.geometry.header;
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match(
			report,
			/\| Header \(#wpadminbar\) \| NOT MEASURED \| selector matched in neither capture \|/
		);
		assert.match( report, /2 geometry finding\(s\)/ );
	} );

	it( 'renders a status-code change as the two status lists', () => {
		const before = flagOffSnapshot();
		const after = flagOnSnapshotWithRetried404();
		before.network.push( {
			url: 'https://example.jurassic.ninja/wp-content/plugins/jetpack/design-tokens.css',
			method: 'GET',
			status: 200,
			resourceType: 'stylesheet',
		} );
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match( report, /Status code changed \(1\):/ );
		assert.match( report, /design-tokens\.css`: 200 -> 200, 404/ );
	} );

	it( 'reports a request that fired a different number of times', () => {
		const before = flagOffSnapshot();
		const after = flagOnSnapshot();
		before.network.push( { ...before.network[ 0 ] } );
		const report = formatReport( diffSnapshots( before, after ), { url: 'x' } );
		assert.match( report, /Request count changed \(1\):/ );
		assert.match( report, /dashboard\.js`: fired 2x -> 1x/ );
	} );
} );
