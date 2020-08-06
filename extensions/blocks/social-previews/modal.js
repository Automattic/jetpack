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
import { applyFilters } from '@wordpress/hooks';
import { has } from 'lodash';

/**
 * Internal dependencies
 */
import SocialPreviewsUpgrade from './upgrade';
import { AVAILABLE_SERVICES } from './constants';

const SocialPreviewsModal = function SocialPreviewsModal( {
	onClose,
	showUpgradeNudge,
	media,
	currentPostId,
	title,
	description,
	url,
	author,
) {

	let mediaSourceUrl;
	if ( media ) {
		const mediaSize = applyFilters(
			'editor.PostFeaturedImage.imageSize',
			'post-thumbnail',
			media.id,
			currentPostId
		);
		if ( has( media, [ 'media_details', 'sizes', mediaSize ] ) ) {
			// use mediaSize when available
			mediaSourceUrl = media.media_details.sizes[ mediaSize ].source_url;
		} else {
			// get fallbackMediaSize if mediaSize is not available
			const fallbackMediaSize = applyFilters(
				'editor.PostFeaturedImage.imageSize',
				'thumbnail',
				media.id,
				currentPostId
			);
			if ( has( media, [ 'media_details', 'sizes', fallbackMediaSize ] ) ) {
				// use fallbackMediaSize when mediaSize is not available
				mediaSourceUrl = media.media_details.sizes[ fallbackMediaSize ].source_url;
			} else {
				// use full image size when mediaFallbackSize and mediaSize are not available
				mediaSourceUrl = media.source_url;
			}
		}
	}

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
								image={ mediaSourceUrl }
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
		media: featuredImageId ? getMedia( featuredImageId ) : null,
		currentPostId: getCurrentPostId(),
		title: getEditedPostAttribute( 'title' ),
		description: getEditedPostAttribute( 'excerpt' ) || getEditedPostAttribute( 'content' ),
		url: getEditedPostAttribute( 'link' ),
		author: user && user.name,
	};
} )( SocialPreviewsModal );
