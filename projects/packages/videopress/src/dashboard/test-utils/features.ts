/**
 * Seed the dashboard feature gates that `src/dashboard/utils/*` read off the
 * inlined `JPVIDEOPRESS_INITIAL_STATE` payload, merging into whatever the test
 * already put there. Pair with {@link resetFeatures} in afterEach so a gate
 * never leaks between tests — they all default to off in production.
 *
 * @param features                - Gate values to set.
 * @param features.chaptersEditor - Whether the chapters editor is enabled.
 */
export function setFeatures( features: { chaptersEditor?: boolean } ): void {
	const win = window as unknown as {
		JPVIDEOPRESS_INITIAL_STATE?: { features?: Record< string, boolean > };
	};

	win.JPVIDEOPRESS_INITIAL_STATE = {
		...win.JPVIDEOPRESS_INITIAL_STATE,
		features: { ...win.JPVIDEOPRESS_INITIAL_STATE?.features, ...features },
	};
}

/**
 * Drop the feature gates again, leaving the rest of the initial state intact
 * so a test that seeded other keys keeps them.
 */
export function resetFeatures(): void {
	const win = window as unknown as {
		JPVIDEOPRESS_INITIAL_STATE?: { features?: Record< string, boolean > };
	};

	if ( win.JPVIDEOPRESS_INITIAL_STATE ) {
		delete win.JPVIDEOPRESS_INITIAL_STATE.features;
	}
}
