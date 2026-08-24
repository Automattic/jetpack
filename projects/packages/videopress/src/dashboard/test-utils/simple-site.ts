/**
 * Flip the dashboard into WordPress.com Simple mode by seeding the
 * `JetpackScriptData` global that `isSimpleSite()` (from
 * `@automattic/jetpack-script-data`) reads. Pair with {@link unsetSimpleSite}
 * in afterEach so mode never leaks between tests.
 */
export function setSimpleSite(): void {
	( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
		site: { host: 'wpcom' },
	};
}

/**
 * Remove the script-data global so subsequent tests run in self-hosted mode.
 */
export function unsetSimpleSite(): void {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
}
