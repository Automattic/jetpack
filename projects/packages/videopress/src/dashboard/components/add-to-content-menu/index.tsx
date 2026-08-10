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
	 * Trigger size. `default` matches the 40px buttons used inside cards (the
	 * upload flow's success step); `compact` matches the dashboard header's
	 * action row.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact';
	className?: string;
};

/**
 * "Add to a post" dropdown for a published video. Mirrors the labelled
 * `DropdownMenu` used by the video detail view's ThumbnailUpdateButton so the
 * two share the design system's look.
 *
 * Shared by the upload flow's success step and the Home screen's header, so
 * both surfaces open content the same way. Only renders when the video has a
 * VideoPress GUID: the hand-off is the server-side `videopress_guid` content
 * filter, and without a GUID there is no honest VideoPress block to insert —
 * a disabled or no-op button here would be worse than no button at all. See
 * `readVideoPressGuid` in the upload route for why the GUID is often absent.
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
			text={ __( 'Add to a post', 'jetpack-videopress-pkg' ) }
			className={ className ?? 'vp-success__add-to' }
			// `__next40pxDefaultSize` keeps the trigger the same height as the
			// adjacent "Go to Library" button, which opts into it too. The header
			// row instead runs `compact` buttons, so it opts out.
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
