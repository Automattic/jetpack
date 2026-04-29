import { Button, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
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
 * @param blogId - WP.com blog id.
 * @return Absolute URL.
 */
function getCsvDownloadUrl( blogId: JetpackBlogId ): string {
	return `https://dashboard.wordpress.com/wp-admin/index.php?page=subscribers&blog=${ blogId }&blog_subscribers=csv&type=all`;
}

/**
 * Page-header action row — primary "Add subscribers" CTA and a More menu (Download CSV).
 *
 * @param props                  - Component props.
 * @param props.blogId           - WP.com blog id, used to build the CSV download URL.
 * @param props.onAddSubscribers - Callback to open the Add Subscribers modal (owned by the parent so the empty state can trigger it too).
 * @return Action row.
 */
export default function HeaderActions( { blogId, onAddSubscribers }: Props ): JSX.Element {
	return (
		<div className="jetpack-subscribers-dashboard__header-actions">
			<Button variant="primary" onClick={ onAddSubscribers }>
				{ __( 'Add subscribers', 'jetpack-subscribers-dashboard' ) }
			</Button>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More options', 'jetpack-subscribers-dashboard' ) }
				controls={ [
					{
						title: __( 'Download as CSV', 'jetpack-subscribers-dashboard' ),
						onClick: () => {
							if ( ! blogId ) {
								return;
							}
							window.open( getCsvDownloadUrl( blogId ), '_blank' );
						},
						isDisabled: ! blogId,
					},
				] }
			/>
		</div>
	);
}
