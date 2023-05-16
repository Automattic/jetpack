/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

import { Modal, TabPanel, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { AVAILABLE_SERVICES } from './constants';
import { getMediaSourceUrl } from './utils';
import './modal.scss';

const SocialPreviewsModal = function SocialPreviewsModal( {
	onClose,
	image,
	title,
	description,
	url,
	initialTabName,
} ) {
	return (
		<Modal
			onRequestClose={ onClose }
			className="jetpack-social-previews__modal"
			__experimentalHideHeader
		>
			<Button
				className="jetpack-social-previews__modal--close-btn"
				onClick={ onClose }
				icon={ close }
				label={ __( 'Close', 'jetpack' ) }
			/>
			<TabPanel
				className="jetpack-social-previews__modal-previews"
				tabs={ AVAILABLE_SERVICES }
				initialTabName={ initialTabName }
			>
				{ tab => (
					<div>
						<tab.preview
							// pass only the props that are common to all previews
							title={ title }
							description={ description }
							url={ url }
							image={ image }
						/>
					</div>
				) }
			</TabPanel>
		</Modal>
	);
};

export default withSelect( select => {
	const { getMedia } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { isTweetStorm } = select( 'jetpack/publicize' );

	const featuredImageId = getEditedPostAttribute( 'featured_media' );
	const media = getMedia( featuredImageId );

	return {
		title:
			getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title || getEditedPostAttribute( 'title' ),
		description:
			getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
			getEditedPostAttribute( 'excerpt' ) ||
			getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
			__( 'Visit the post for more.', 'jetpack' ),
		url: getEditedPostAttribute( 'link' ),
		image: ( !! featuredImageId && getMediaSourceUrl( media ) ) || '',
		initialTabName: isTweetStorm() ? 'twitter' : null,
	};
} )( SocialPreviewsModal );
