import { ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import { Disabled, ExternalLink, Notice, BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { Fragment } from 'react';
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
 * @param {string} [props.disabledNoticeMessage=''] - An optional notice that's displayed when the section is disabled.
 * @param {import('react').ReactNode} [props.CustomNotice=null] - An optional custom notice that's displayed.
 * @param {boolean} props.socialPostDisabled - Indicates whether the social post checkbox is disabled or not.
 * @returns {object} The media section.
 */
export default function MediaSection( {
	disabled = false,
	disabledNoticeMessage = '',
	CustomNotice = null,
	socialPostDisabled = false,
} ) {
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();

	const [ mediaDetails ] = useMediaDetails( attachedMedia[ 0 ]?.id );

	const onChange = useCallback(
		media => {
			if ( ! media ) {
				updateAttachedMedia( [] );
			} else {
				const { id, url, mime: type } = media;
				updateAttachedMedia( [ { id, url, type } ] );
			}
		},
		[ updateAttachedMedia ]
	);

	const MediaWrapper = disabled ? Disabled : Fragment;
	const mediaWrapperProps = disabled
		? { className: styles.disabled, 'data-testid': 'disabled' }
		: {};

	const renderHeaderSection = () => {
		if ( CustomNotice ) {
			return CustomNotice;
		}

		return disabledNoticeMessage ? (
			<Notice className={ styles.notice } isDismissible={ false } status="warning">
				<p data-testid="notice">{ disabledNoticeMessage }</p>
			</Notice>
		) : (
			<p className={ styles.subtitle }>
				{ __( 'Choose a visual to accompany your post.', 'jetpack' ) }
			</p>
		);
	};

	return (
		<ThemeProvider>
			<BaseControl label={ __( 'Media', 'jetpack' ) } className={ styles.wrapper }>
				{ renderHeaderSection() }
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
			<SocialPostControl disabled={ socialPostDisabled } />
		</ThemeProvider>
	);
}
