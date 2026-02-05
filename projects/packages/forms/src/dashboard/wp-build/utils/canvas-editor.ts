/**
 * Canvas editor helpers for wp-build routes.
 */

type CanvasData = {
	postType: string;
	postId: string;
	isPreview?: boolean;
	component?: unknown;
};

/**
 * Convert a search param into CanvasData for editing a `jetpack_form`.
 *
 * @param editFormId - Form ID to edit.
 * @return CanvasData or undefined.
 */
export function getJetpackFormCanvasData( editFormId?: number | string ): CanvasData | undefined {
	const id = typeof editFormId === 'number' ? editFormId : Number( editFormId );
	if ( ! Number.isFinite( id ) || id <= 0 ) {
		return;
	}
	return {
		postType: 'jetpack_form',
		postId: String( id ),
	};
}
