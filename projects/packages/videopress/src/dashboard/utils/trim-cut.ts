/**
 * Whether the trim and cut editor is enabled for this dashboard.
 *
 * @return Whether trim and cut is available.
 */
export function isTrimCutEnabled(): boolean {
	return (
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' &&
		Boolean( JPVIDEOPRESS_INITIAL_STATE?.features?.trimCut )
	);
}
