import { ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import { Disabled, ExternalLink, Notice, BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaDetails from '../../hooks/use-media-details';
import MediaPicker from '../media-picker';
import SocialPostControl from '../social-post-control';
import styles from './styles.module.scss';
const ADD_MEDIA_LABEL = __( 'Choose Media', 'jetpack' );

/**
 * Wrapper that handles media-related functionality.
 *
 * @param {object} props - The properties passed to the component.
 * @param {boolean} [props.disabled=false] - Indicates whether the MediaSection is disabled or not.
 * @param {string} [props.notice=''] - An optional notice that's displayed when the section is disabled.
 * @returns {object} The media section.
 */
export default function MediaSection( { disabled = false, notice = '' } ) {
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	const [ mediaDetails ] = useMediaDetails( attachedMedia[ 0 ]?.id );

	const onChange = useCallback(
		media => {
			if ( ! media ) {
				updateAttachedMedia( [] );
			} else {
				const { id, url } = media;
				updateAttachedMedia( [ { id, url } ] );
			}
		},
		[ updateAttachedMedia ]
	);

	const MediaWrapper = disabled ? Disabled : Fragment;
	const mediaWrapperProps = disabled
		? { className: styles.disabled, 'data-testid': 'disabled' }
		: {};

	return (
		<ThemeProvider>
			<BaseControl label={ __( 'Media', 'jetpack' ) } className={ styles.wrapper }>
				{ notice ? (
					<Notice className={ styles.notice } isDismissible={ false } status="warning">
						<p data-testid="notice">{ notice }</p>
					</Notice>
				) : (
					<p className={ styles.subtitle }>
						{ __( 'Choose a visual to accompany your post.', 'jetpack' ) }
					</p>
				) }

				<MediaWrapper { ...mediaWrapperProps }>
					<MediaPicker
						buttonLabel={ ADD_MEDIA_LABEL }
						subTitle={ __( 'Add an image or video', 'jetpack' ) }
						mediaId={ attachedMedia[ 0 ]?.id }
						mediaDetails={ mediaDetails }
						onChange={ onChange }
					/>
					<ExternalLink href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
						{ __( 'Learn photo and video best practices', 'jetpack' ) }
					</ExternalLink>
				</MediaWrapper>
			</BaseControl>
			<SocialPostControl />
		</ThemeProvider>
	);
}
