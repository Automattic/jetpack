/**
 * Social Previews modal component.
 *
 * Shows individual previews in modal window.
 */

import { Modal, TabPanel, Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import {
	getAttachedMedia,
	getImageGeneratorPostSettings,
	shouldUploadAttachedMedia,
} from '../../store/selectors';
import { getSigImageUrl } from '../generated-image-preview/utils';
import { useAvailableSerivces } from './useAvailableServices';
import { getMediaSourceUrl } from './utils';
import './modal.scss';

const SocialPreviewsModal = function SocialPreviewsModal( {
	onClose,
	image,
	media,
	title,
	description,
	url,
	initialTabName,
} ) {
	const availableServices = useAvailableSerivces();

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
				tabs={ availableServices }
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
							media={ media }
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

	// Use the featured image by default, if it's available.
	let image = featuredImageId ? getMediaSourceUrl( getMedia( featuredImageId ) ) : '';

	const sigSettings = getImageGeneratorPostSettings();

	const sigImageUrl = sigSettings.enabled ? getSigImageUrl( sigSettings.token ) : '';

	const attachedMedia = getAttachedMedia();

	// If we have a SIG token, use it to generate the image URL.
	if ( sigImageUrl ) {
		image = sigImageUrl;
	} else if ( attachedMedia?.[ 0 ]?.id ) {
		// If we don't have a SIG image, use the first image in the attached media.
		const [ firstMedia ] = attachedMedia;
		const isImage = firstMedia.id
			? getMedia( firstMedia.id )?.mime_type?.startsWith( 'image/' )
			: false;

		if ( isImage && firstMedia.url ) {
			image = firstMedia.url;
		}
	}

	const media = [];

	// Attach media only if "Share as a social post" option is enabled.
	if ( shouldUploadAttachedMedia() ) {
		if ( sigImageUrl ) {
			media.push( {
				type: 'image/jpeg',
				url: sigImageUrl,
				alt: '',
			} );
		} else {
			const getMediaDetails = id => {
				const mediaItem = getMedia( id );
				if ( ! mediaItem ) {
					return null;
				}
				return {
					type: mediaItem.mime_type,
					url: getMediaSourceUrl( mediaItem ),
					alt: mediaItem.alt_text,
				};
			};

			for ( const { id } of attachedMedia ) {
				const mediaDetails = getMediaDetails( id );
				if ( mediaDetails ) {
					media.push( mediaDetails );
				}
			}
			if ( 0 === media.length && featuredImageId ) {
				media.push( getMediaDetails( featuredImageId ) );
			}
		}
	}

	return {
		title:
			getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title || getEditedPostAttribute( 'title' ),
		description:
			getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
			getEditedPostAttribute( 'excerpt' ) ||
			getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
			__( 'Visit the post for more.', 'jetpack' ),
		url: getEditedPostAttribute( 'link' ),
		image,
		media,
		initialTabName: isTweetStorm() ? 'twitter' : null,
	};
} )( SocialPreviewsModal );
