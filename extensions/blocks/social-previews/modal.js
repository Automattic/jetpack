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
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SocialPreviewsUpgrade from './upgrade';
import { AVAILABLE_SERVICES } from './constants';
import { SocialServiceIcon } from '../../shared/icons';
import { getMediaSourceUrl } from './utils';
import './modal.scss';

const SocialPreviewsModal = function SocialPreviewsModal( {
	onClose,
	showUpgradeNudge,
	image,
	title,
	description,
	url,
	author,
} ) {
	// Inject the service icon into the title
	const tabs = AVAILABLE_SERVICES.map( service => {
		return {
			...service,
			title: (
				<Fragment>
					<SocialServiceIcon serviceName={ service.icon } />
					{ service.title }
				</Fragment>
			),
		};
	} );

	return (
		<Modal
			onRequestClose={ onClose }
			title={ __( 'Social Previews', 'jetpack' ) }
			className="jetpack-social-previews__modal"
		>
			{ showUpgradeNudge ? (
				<SocialPreviewsUpgrade />
			) : (
				<TabPanel
					className="jetpack-social-previews__modal-previews"
					tabs={ tabs }
					orientation="vertical"
				>
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
		description:
			getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
			getEditedPostAttribute( 'excerpt' ) ||
			getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
			__( 'Visit the post for more.', 'jetpack' ),
		url: getEditedPostAttribute( 'link' ),
		author: user?.name,
		image:
			!! featuredImageId && getMediaSourceUrl( getMedia( featuredImageId ), getCurrentPostId() ),
	};
} )( SocialPreviewsModal );
