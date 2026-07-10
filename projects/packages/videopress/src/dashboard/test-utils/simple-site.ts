/**
 * Flip the dashboard into WordPress.com Simple mode by seeding the boot
 * global consumed by `isSimpleSite()`. Pair with {@link unsetSimpleSite}
 * in afterEach so mode never leaks between tests.
 */
export function setSimpleSite(): void {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
		siteData: { isSimple: true },
	};
}

/**
 * Remove the boot global so subsequent tests run in self-hosted mode.
 */
export function unsetSimpleSite(): void {
	delete ( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } )
		.JPVIDEOPRESS_INITIAL_STATE;
}
