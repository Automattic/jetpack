/**
 * Fixture snapshots for src/*.test.js, shaped like `capture.js`'s output. `flagOffSnapshot`
 * and `flagOnSnapshot` model a clean port: only the accepted 8px stage-gutter inset on the
 * page root differs. The other fixtures start from a clone and introduce one specific defect,
 * matching the two real bugs JETPACK-2573 cites from the My Jetpack pilot.
 */

/** The flag-off baseline every other fixture is built from. */
export function flagOffSnapshot() {
	return {
		meta: {
			url: 'https://example.jurassic.ninja/wp-admin/admin.php?page=jetpack',
			capturedAt: '2026-09-21T12:00:00.000Z',
		},
		geometry: {
			root: {
				label: 'Page root (#wpwrap)',
				hidden: false,
				rect: { x: 0, y: 0, width: 1280, height: 900 },
				style: { fontFamily: 'Arial, sans-serif' },
			},
			wpbodyContent: {
				label: '#wpbody-content',
				hidden: false,
				rect: { x: 160, y: 32, width: 1120, height: 860 },
				style: { fontFamily: 'Arial, sans-serif' },
			},
			header: {
				label: 'Header (#wpadminbar)',
				hidden: false,
				rect: { x: 0, y: 0, width: 1280, height: 32 },
				style: { fontFamily: 'Arial, sans-serif' },
			},
			footer: {
				label: 'Footer (#wpfooter)',
				hidden: false,
				rect: { x: 160, y: 880, width: 1120, height: 20 },
				style: { fontFamily: 'Arial, sans-serif' },
			},
			control: {
				label: 'Control',
				hidden: false,
				rect: { width: 100, height: 36 },
				style: {
					fontFamily: 'Arial, sans-serif',
					marginTop: 8,
					marginRight: 8,
					marginBottom: 8,
					marginLeft: 8,
					paddingTop: 6,
					paddingRight: 12,
					paddingBottom: 6,
					paddingLeft: 12,
					borderTopWidth: 1,
					borderRightWidth: 1,
					borderBottomWidth: 1,
					borderLeftWidth: 1,
					boxSizing: 'border-box',
					fontSize: '13px',
				},
			},
		},
		network: [
			{
				url: 'https://example.jurassic.ninja/wp-content/plugins/jetpack/dashboard.js',
				method: 'GET',
				status: 200,
				resourceType: 'script',
			},
			{
				url: 'https://example.jurassic.ninja/wp-json/jetpack/v4/settings?_wpnonce=aaa',
				method: 'GET',
				status: 200,
				resourceType: 'xhr',
			},
		],
	};
}

/**
 * A clean port: the page root shifts by the one accepted 8px stage-gutter inset, and
 * #wpfooter goes hidden (which boot does by design -- see selectors.js). Nothing else moves.
 */
export function flagOnSnapshot() {
	const snapshot = flagOffSnapshot();
	snapshot.meta.capturedAt = '2026-09-21T12:03:00.000Z';
	snapshot.geometry.root = {
		...snapshot.geometry.root,
		rect: { x: 8, y: 8, width: 1264, height: 884 },
	};
	snapshot.geometry.footer = {
		...snapshot.geometry.footer,
		hidden: true,
		rect: { x: 0, y: 0, width: 0, height: 0 },
	};
	snapshot.network[ 1 ] = {
		...snapshot.network[ 1 ],
		url: snapshot.network[ 1 ].url.replace( 'aaa', 'bbb' ),
	};
	return snapshot;
}

/** Reproduces the pilot's design-tokens.css 404: a new request carrying a nonce, same everything else. */
export function flagOnSnapshotWith404() {
	const snapshot = flagOnSnapshot();
	snapshot.network.push( {
		url: 'https://example.jurassic.ninja/wp-content/plugins/jetpack/design-tokens.css?_wpnonce=deadbeef1234',
		method: 'GET',
		status: 404,
		resourceType: 'stylesheet',
	} );
	return snapshot;
}

/**
 * The same 404, but on a path that is then fetched again successfully. Keying the diff by
 * method + path alone would let the 200 overwrite the 404 and report nothing.
 */
export function flagOnSnapshotWithRetried404() {
	const snapshot = flagOnSnapshot();
	const url = 'https://example.jurassic.ninja/wp-content/plugins/jetpack/design-tokens.css';
	snapshot.network.push(
		{ url, method: 'GET', status: 404, resourceType: 'stylesheet' },
		{ url, method: 'GET', status: 200, resourceType: 'stylesheet' }
	);
	return snapshot;
}

/** Reproduces a real geometry regression: #wpbody-content grows 12px wider than trunk. */
export function flagOnSnapshotWithGeometryShift() {
	const snapshot = flagOnSnapshot();
	snapshot.geometry.wpbodyContent = {
		...snapshot.geometry.wpbodyContent,
		rect: { ...snapshot.geometry.wpbodyContent.rect, width: 1132 },
	};
	return snapshot;
}

/**
 * An UNEXPECTED visibility regression: the header goes hidden too. Unlike the footer,
 * `header` has no `allowHidden` in `DEFAULT_GEOMETRY_TARGETS`, so this must surface as a
 * finding.
 */
export function flagOnSnapshotWithUnexpectedlyHiddenHeader() {
	const snapshot = flagOnSnapshot();
	snapshot.geometry.header = {
		...snapshot.geometry.header,
		hidden: true,
		rect: { x: 0, y: 0, width: 0, height: 0 },
	};
	return snapshot;
}
