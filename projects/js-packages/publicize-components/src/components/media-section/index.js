import { ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Disabled, ExternalLink, Notice, BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { Fragment } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaDetails from '../../hooks/use-media-details';
import MediaPicker from '../media-picker';
import styles from './styles.module.scss';
const ADD_MEDIA_LABEL = __( 'Choose Media', 'jetpack-publicize-components' );

/**
 * Wrapper that handles media-related functionality.
 *
 * @param {object}                    props                            - The properties passed to the component.
 * @param {boolean}                   [props.disabled=false]           - Indicates whether the MediaSection is disabled or not.
 * @param {string}                    [props.disabledNoticeMessage=''] - An optional notice that's displayed when the section is disabled.
 * @param {import('react').ReactNode} [props.CustomNotice=null]        - An optional custom notice that's displayed.
 * @param {object}                    [props.analyticsData]            - Data for tracking analytics.
 * @return {object} The media section.
 */
export default function MediaSection( {
	disabled = false,
	disabledNoticeMessage = '',
	CustomNotice = null,
	analyticsData,
} ) {
	const { attachedMedia, updateAttachedMedia } = useAttachedMedia();
	const { recordEvent } = useAnalytics();

	const [ mediaDetails ] = useMediaDetails( attachedMedia[ 0 ]?.id );

	const onChange = useCallback(
		media => {
			if ( ! media ) {
				updateAttachedMedia( [] );
			} else {
				recordEvent( 'jetpack_social_media_attached', analyticsData );

				const { id, url, mime: type } = media;
				updateAttachedMedia( [ { id, url, type } ] );
			}
		},
		[ analyticsData, recordEvent, updateAttachedMedia ]
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
				{ __( 'Choose a visual to accompany your post.', 'jetpack-publicize-components' ) }
			</p>
		);
	};

	return (
		<ThemeProvider>
			<BaseControl __nextHasNoMarginBottom={ true } className={ styles.wrapper }>
				<BaseControl.VisualLabel>
					{ __( 'Attached Media', 'jetpack-publicize-components' ) }
				</BaseControl.VisualLabel>
				{ renderHeaderSection() }
				<MediaWrapper { ...mediaWrapperProps }>
					<MediaPicker
						buttonLabel={ ADD_MEDIA_LABEL }
						subTitle={ __( 'Add an image or video', 'jetpack-publicize-components' ) }
						mediaId={ attachedMedia[ 0 ]?.id }
						mediaDetails={ mediaDetails }
						onChange={ onChange }
					/>
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }
						className={ styles[ 'learn-more' ] }
					>
						{ __( 'Learn photo and video best practices', 'jetpack-publicize-components' ) }
					</ExternalLink>
				</MediaWrapper>
			</BaseControl>
		</ThemeProvider>
	);
}
