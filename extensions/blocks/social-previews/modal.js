/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, TabPanel } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SocialPreviewsUpgrade from './upgrade';
import { AVAILABLE_SERVICES } from './constants';
import { getMediaSourceUrl } from './utils';

const SocialPreviewsModal = function SocialPreviewsModal( {
	onClose,
	showUpgradeNudge,
	image,
	title,
	description,
	url,
	author,
} ) {
	return (
		<Modal
			onRequestClose={ onClose }
			title={ __( 'Social Previews', 'jetpack' ) }
			className="jetpack-social-previews__modal"
		>
			{ showUpgradeNudge ? (
				<SocialPreviewsUpgrade />
			) : (
				<TabPanel className="jetpack-social-previews__tabs" tabs={ AVAILABLE_SERVICES }>
					{ tab => (
						<div>
							<tab.preview
								title={ title }
								description={ description }
								url={ url }
								author={ author }
								image={ image }
							/>
						</div>
					) }
				</TabPanel>
			) }
		</Modal>
	);
};

export default withSelect( ( select, props ) => {
	// No need to load anything when the feature is not active.
	if ( props.showUpgradeNudge ) {
		return {};
	}

	const { getMedia, getUser } = select( 'core' );
	const { getCurrentPost, getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );

	const featuredImageId = getEditedPostAttribute( 'featured_media' );
	const authorId = getEditedPostAttribute( 'author' );
	const user = authorId && getUser( authorId );

	return {
		post: getCurrentPost(),
		title: getEditedPostAttribute( 'title' ),
		description: getEditedPostAttribute( 'excerpt' ) || getEditedPostAttribute( 'content' ),
		url: getEditedPostAttribute( 'link' ),
		author: user && user.name,
		image: featuredImageId && getMediaSourceUrl( getMedia( featuredImageId ), getCurrentPostId() ),
	};
} )( SocialPreviewsModal );
