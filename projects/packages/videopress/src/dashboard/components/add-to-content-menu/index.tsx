/**
 * External dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, page as pageIcon, post as postIcon } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

// The two content types this menu can hand a video off to. Anything else
// (adding to an *existing* post or page) is deliberately out of scope.
export type NewContentType = 'post' | 'page';

/**
 * The nonce the server requires before it will fill a new post with the video.
 *
 * Read in two places — the render guard and the click handler — because the
 * menu must not appear at all when it cannot work.
 *
 * @return The content nonce, or undefined when the boot payload has none.
 */
export const readContentNonce = (): string | undefined => {
	const nonce =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.API?.contentNonce
			: undefined;

	return typeof nonce === 'string' && nonce !== '' ? nonce : undefined;
};

/**
 * Open a brand-new post or page in the block editor with the video already in
 * it. The block markup is produced server-side by
 * `Block_Editor_Content::videopress_video_block_by_guid()`, which filters
 * `default_content` on `post-new.php` when the request carries a GUID and a
 * valid `videopress-content-nonce`. Because it hooks `post-new.php`, passing
 * `post_type=page` gets page support for free.
 *
 * Opened in a new tab so the user keeps their place on the dashboard.
 *
 * @param guid        - The VideoPress GUID of the published video.
 * @param contentType - Whether to create a new post or a new page.
 */
export const openInNewContent = ( guid: string, contentType: NewContentType ) => {
	const nonce = readContentNonce();

	if ( ! guid || ! nonce ) {
		return;
	}

	const args: Record< string, string > = { videopress_guid: guid, _wpnonce: nonce };
	if ( contentType === 'page' ) {
		args.post_type = 'page';
	}

	window.open( addQueryArgs( 'post-new.php', args ), '_blank' );
};

type Props = {
	/** The VideoPress GUID of the video to insert. */
	guid?: string;
	/** Accessible label for the trigger; disambiguates the menu when several are on screen. */
	label?: string;
	/**
	 * Trigger size. `compact` matches the dashboard header's action row, which
	 * is the only place this renders today; `default` is the 40px in-card size.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact';
	className?: string;
};

/**
 * "Add to a post or page" dropdown for a published video. Mirrors the labelled
 * `DropdownMenu` used by the video detail view's ThumbnailUpdateButton so the
 * two share the design system's look.
 *
 * Rendered from the video screen's header actions — the one place it appears
 * today. Only renders when the video has both a VideoPress GUID and a content
 * nonce: the hand-off is the server-side `videopress_guid` content filter, so
 * without either there is no honest VideoPress block to insert, and a menu
 * whose items silently open a blank editor is worse than no menu at all. A
 * GUID is absent on local attachments and on videos still being registered
 * with VideoPress.
 *
 * NOTE: `add/videopress-upload-onboarding` carries a near-identical copy of
 * this file at the same path, differing only in the trigger's `text`. If both
 * branches land, reconcile them into one component rather than resolving the
 * conflict by picking a string.
 *
 * @param props           - Component props.
 * @param props.guid      - The VideoPress GUID of the video to insert.
 * @param props.label     - Accessible label for the trigger.
 * @param props.size      - Trigger size (`default` or `compact`).
 * @param props.className - Extra class for the dropdown root.
 * @return The dropdown, or null when no GUID is available.
 */
export default function AddToContentMenu( { guid, label, size, className }: Props ) {
	// Both halves of the hand-off have to be present, not just the GUID. The
	// server only fills `default_content` when the request carries a valid
	// `videopress-content-nonce`, so without it every item in this menu would
	// open a blank editor — the silent no-op this component's own docblock
	// promises not to ship.
	if ( ! guid || ! readContentNonce() ) {
		return null;
	}

	return (
		<DropdownMenu
			// `plus` on the trigger rather than `postIcon`: the menu items already
			// carry the post/page glyphs, so reusing one here would read as a duplicate.
			icon={ plus }
			label={ label ?? __( 'Add to a post or page', 'jetpack-videopress-pkg' ) }
			// Names the category, not one of its own two options — the menu
			// offers a page as well, so "Add to a post" read as a mislabel.
			text={ __( 'Add to a post or page', 'jetpack-videopress-pkg' ) }
			className={ className }
			// The header row runs `compact` controls, so `compact` matches Save
			// beside it. `default` opts into `__next40pxDefaultSize` for the
			// in-card size, which nothing uses here yet.
			toggleProps={
				size === 'compact'
					? { variant: 'secondary', size: 'compact' }
					: { variant: 'secondary', __next40pxDefaultSize: true }
			}
		>
			{ ( { onClose }: { onClose: () => void } ) => (
				<MenuGroup>
					<MenuItem
						icon={ postIcon }
						onClick={ () => {
							openInNewContent( guid, 'post' );
							onClose();
						} }
					>
						{ __( 'New post', 'jetpack-videopress-pkg' ) }
					</MenuItem>
					<MenuItem
						icon={ pageIcon }
						onClick={ () => {
							openInNewContent( guid, 'page' );
							onClose();
						} }
					>
						{ __( 'New page', 'jetpack-videopress-pkg' ) }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
