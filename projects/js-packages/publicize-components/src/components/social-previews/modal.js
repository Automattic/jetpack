/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

import { Modal, TabPanel, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
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
	author,
	isTweetStorm,
	tweets,
	media,
	siteTitle,
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
				initialTabName={ isTweetStorm ? 'twitter' : null }
			>
				{ tab => (
					<div>
						<tab.preview
							title={ title }
							description={ description }
							url={ url }
							author={ author }
							image={ image }
							isTweetStorm={ isTweetStorm }
							tweets={ tweets }
							media={ media }
							siteTitle={ siteTitle }
						/>
					</div>
				) }
			</TabPanel>
		</Modal>
	);
};

export default withSelect( select => {
	const { getMedia, getUser, getEntityRecord } = select( 'core' );
	const { getCurrentPost, getEditedPostAttribute } = select( 'core/editor' );
	const { getTweetTemplate, getTweetStorm, getShareMessage, isTweetStorm } =
		select( 'jetpack/publicize' );

	const featuredImageId = getEditedPostAttribute( 'featured_media' );
	const authorId = getEditedPostAttribute( 'author' );
	const user = authorId && getUser( authorId );
	const media = getMedia( featuredImageId );

	const postData = {
		post: getCurrentPost(),
		title:
			getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title || getEditedPostAttribute( 'title' ),
		description:
			getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
			getEditedPostAttribute( 'excerpt' ) ||
			getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
			__( 'Visit the post for more.', 'jetpack' ),
		url: getEditedPostAttribute( 'link' ),
		author: user?.name,
		image: ( !! featuredImageId && getMediaSourceUrl( media ) ) || '',
		siteTitle: decodeEntities( getEntityRecord( 'root', 'site' ).title ),
	};

	let tweets = [];
	if ( isTweetStorm() ) {
		tweets = getTweetStorm();
	} else {
		tweets.push( {
			...getTweetTemplate(),
			text: getShareMessage(),
			card: {
				...postData,
				type: postData.image ? 'summary_large_image' : 'summary',
			},
		} );
	}

	return {
		...postData,
		tweets,
		media: media
			? [
					{
						type: media.mime_type,
						url: getMediaSourceUrl( media ),
						alt: media.alt_text,
					},
			  ]
			: null,
		isTweetStorm: isTweetStorm(),
	};
} )( SocialPreviewsModal );
