import { ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink, Notice, BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions, {
	FILE_SIZE_ERROR,
	FILE_TYPE_ERROR,
	VIDEO_LENGTH_TOO_LONG_ERROR,
	VIDEO_LENGTH_TOO_SHORT_ERROR,
} from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import MediaPicker from '../media-picker';
import styles from './styles.module.scss';

const ADD_MEDIA_LABEL = __( 'Choose Media', 'jetpack' );

/**
 * Wrapper that handles media-related functionality.
 *
 * @returns {object} The media section.
 */
export default function MediaSection() {
	const [ validationError, setValidationError ] = useState( null );
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const { enabledConnections } = useSocialMediaConnections();

	const [ mediaDetails ] = useMediaDetails( attachedMedia[ 0 ]?.id );

	const { maxImageSize, getValidationError, allowedMediaTypes } =
		useMediaRestrictions( enabledConnections );

	const validationErrorMessages = {
		[ FILE_TYPE_ERROR ]: __(
			'The selected media type is not accepted by these platforms.',
			'jetpack'
		),
		[ FILE_SIZE_ERROR ]: sprintf(
			/* translators: placeholder is the maximum image size in MB */
			__( 'This media is over %d MB and cannot be used for these platforms.', 'jetpack' ),
			maxImageSize
		),
		[ VIDEO_LENGTH_TOO_LONG_ERROR ]: __(
			'The selected video is too long for these platforms.',
			'jetpack'
		),
		[ VIDEO_LENGTH_TOO_SHORT_ERROR ]: __(
			'The selected video is too short for these platforms.',
			'jetpack'
		),
	};

	useEffect( () => {
		// Removes selected media if connection change results in invalid image
		if ( ! mediaDetails.metaData || ! attachedMedia.length ) {
			return;
		}

		const error = getValidationError( mediaDetails.metaData );
		if ( error ) {
			setValidationError( error );
			updateAttachedMedia( [] );
		}
	}, [ attachedMedia, updateAttachedMedia, getValidationError, mediaDetails ] );

	const onChange = useCallback(
		media => {
			if ( ! media ) {
				updateAttachedMedia( [] );
			} else {
				const { id, url } = media;
				updateAttachedMedia( [ { id, url } ] );
			}
			setValidationError( null );
		},
		[ updateAttachedMedia ]
	);

	const onDismissClick = useCallback( () => setValidationError( null ), [] );
	return (
		<ThemeProvider>
			<BaseControl label={ __( 'Media', 'jetpack' ) } className={ styles.wrapper }>
				<p className={ styles.subtitle }>
					{ __( 'Choose a visual to accompany your post.', 'jetpack' ) }
				</p>

				<MediaPicker
					buttonLabel={ ADD_MEDIA_LABEL }
					subTitle={ __( 'Add an image or video', 'jetpack' ) }
					mediaId={ attachedMedia[ 0 ]?.id }
					mediaDetails={ mediaDetails }
					onChange={ onChange }
					allowedMediaTypes={ allowedMediaTypes }
				/>

				<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
					{ __( 'Learn photo and video best practices', 'jetpack' ) }
				</ExternalLink>
				{ validationError && (
					<Notice
						className={ styles.notice }
						isDismissible={ true }
						onDismiss={ onDismissClick }
						status="warning"
					>
						<p>{ validationErrorMessages[ validationError ] }</p>
						<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
							{ __( 'Troubleshooting tips', 'jetpack' ) }
						</ExternalLink>
					</Notice>
				) }
			</BaseControl>
		</ThemeProvider>
	);
}
