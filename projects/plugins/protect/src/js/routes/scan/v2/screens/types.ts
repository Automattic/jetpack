/**
 * Local mirror of `@wordpress/dataviews`' `RenderModalProps<Item>`.
 *
 * Protect doesn't depend on `@wordpress/dataviews` directly; the type is
 * inlined here (rather than imported) so the four modal components share
 * one definition and don't drift. Keep the shape in sync with upstream
 * `@wordpress/dataviews`'s `RenderModalProps` if that ever changes.
 */
export interface RenderModalProps< Item > {
	items: Item[];
	closeModal?: () => void;
	onActionPerformed?: ( items: Item[] ) => void;
}
