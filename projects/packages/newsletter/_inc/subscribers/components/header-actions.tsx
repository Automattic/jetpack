import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import { recordTracksEvent } from '../lib/tracks';
import type { JetpackBlogId } from '../lib/site';

type Props = {
	blogId: JetpackBlogId | null;
	onAddSubscribers: () => void;
};

/**
 * Build the Calypso-equivalent CSV export URL for a given blog id. The endpoint streams a CSV
 * download for the blog's subscribers and is what Calypso links to from its "Download as CSV"
 * menu item.
 *
 * @param blogId - WP.com blog id (coerced to a positive integer before injection).
 * @return Absolute URL, or null when the id can't be coerced to a positive integer.
 */
function getCsvDownloadUrl( blogId: JetpackBlogId ): string | null {
	const safeId = Math.trunc( Number( blogId ) );
	if ( ! Number.isFinite( safeId ) || safeId <= 0 ) {
		return null;
	}
	return `https://dashboard.wordpress.com/wp-admin/index.php?page=subscribers&blog=${ safeId }&blog_subscribers=csv&type=all`;
}

/**
 * Page-header action row — primary "Add subscribers" CTA and a More menu (Download CSV).
 * Page already wraps actions in a Stack with `gap="sm"`, so we don't add an extra wrapper here.
 *
 * @param props                  - Component props.
 * @param props.blogId           - WP.com blog id, used to build the CSV download URL.
 * @param props.onAddSubscribers - Callback to open the Add Subscribers modal (owned by the parent so the empty state can trigger it too).
 * @return Action row.
 */
export default function HeaderActions( { blogId, onAddSubscribers }: Props ): JSX.Element {
	return (
		<>
			<Button size="compact" onClick={ onAddSubscribers }>
				{ __( 'Add subscribers', 'jetpack-newsletter' ) }
			</Button>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More options', 'jetpack-newsletter' ) }
				controls={ [
					{
						title: __( 'Download as CSV', 'jetpack-newsletter' ),
						onClick: () => {
							const url = blogId ? getCsvDownloadUrl( blogId ) : null;
							if ( url ) {
								recordTracksEvent( 'jetpack_subscribers_export_downloaded' );
								window.open( url, '_blank', 'noopener,noreferrer' );
							}
						},
						isDisabled: ! blogId,
					},
				] }
			/>
		</>
	);
}
