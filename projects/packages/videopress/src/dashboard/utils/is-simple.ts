/**
 * Whether the modernized dashboard is running on a WordPress.com Simple site.
 *
 * The boot payload (`class-initial-state.php`) sets `siteData.isSimple` there; it's
 * absent (falsy) on self-hosted Jetpack and Atomic, which keep the standalone
 * REST/media behavior. Reading it lets the shared media mapping branch to the Simple
 * `/wp/v2/media` response shape — poster/duration on `media_details` directly, no
 * `videopress` sub-object, no server-side VideoPress-type filtering — without touching
 * self-hosted behavior.
 *
 * Guards for the global being undefined so tests and the legacy page — where
 * `var JPVIDEOPRESS_INITIAL_STATE` isn't inlined — resolve to `false`.
 *
 * @return `true` on WordPress.com Simple, `false` everywhere else.
 */
export function isSimpleSite(): boolean {
	return typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
		? Boolean( JPVIDEOPRESS_INITIAL_STATE?.siteData?.isSimple )
		: false;
}
