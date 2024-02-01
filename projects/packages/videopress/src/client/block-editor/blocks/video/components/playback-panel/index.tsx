/**
 *External dependencies
 */
import { ExternalLink, PanelBody, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoControlProps } from '../../types';
import styles from './style.module.scss';
/**
 * Types
 */
import type React from 'react';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}      Playback block sidebar panel
 */
export default function PlaybackPanel( { attributes, setAttributes }: VideoControlProps ) {
	const { autoplay, loop, muted, controls, playsinline, preload, posterData } = attributes;

	// Is Preview On Hover effect enabled?
	const isPreviewOnHoverEnabled = posterData?.previewOnHover;

	const handleAttributeChange = useCallback(
		( attributeName: string, attributeValue?: string ) => {
			return newValue => {
				setAttributes( { [ attributeName ]: attributeValue ?? newValue } );
			};
		},
		[ setAttributes ]
	);

	const AutoplayHelp = () => {
		/*
		 * If the preview on hover effect is enabled,
		 * we want to let the user know that the autoplay
		 * option is not available.
		 */
		if ( isPreviewOnHoverEnabled ) {
			return (
				<span className={ styles[ 'help-message' ] }>
					{ __(
						'Autoplay is turned off as the preview on hover is active.',
						'jetpack-videopress-pkg'
					) }
				</span>
			);
		}

		return (
			<>
				<span className={ styles[ 'help-message' ] }>
					{ __( 'Start playing the video as soon as the page loads.', 'jetpack-videopress-pkg' ) }
				</span>
				{ autoplay && (
					<span className={ styles[ 'help-message' ] }>
						{ __(
							'Note: Autoplaying videos may cause usability issues for some visitors.',
							'jetpack-videopress-pkg'
						) }
					</span>
				) }
			</>
		);
	};

	return (
		<PanelBody title={ __( 'Playback', 'jetpack-videopress-pkg' ) }>
			<ToggleControl
				label={ __( 'Autoplay', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'autoplay' ) }
				checked={ autoplay && ! isPreviewOnHoverEnabled }
				disabled={ isPreviewOnHoverEnabled }
				help={ <AutoplayHelp /> }
			/>

			<ToggleControl
				label={ __( 'Loop', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'loop' ) }
				checked={ loop }
				help={ __( 'Restarts the video when it reaches the end.', 'jetpack-videopress-pkg' ) }
			/>

			<ToggleControl
				label={ __( 'Muted', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'muted' ) }
				checked={ muted }
			/>

			<ToggleControl
				label={ __( 'Show Controls', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'controls' ) }
				checked={ controls }
				help={ __( 'Display the video playback controls.', 'jetpack-videopress-pkg' ) }
			/>

			<ToggleControl
				label={ __( 'Play Inline', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'playsinline' ) }
				checked={ playsinline }
				help={ __(
					'Play the video inline instead of full-screen on mobile devices.',
					'jetpack-videopress-pkg'
				) }
			/>

			<ToggleControl
				label={ __( 'Preload Metadata', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange(
					'preload',
					preload === 'metadata' ? 'none' : 'metadata'
				) }
				checked={ preload === 'metadata' }
				help={ __(
					'Preload the video metadata when the page is loaded.',
					'jetpack-videopress-pkg'
				) }
			/>

			{ createInterpolateElement(
				__( 'Send us your <a>VideoPress feedback</a>', 'jetpack-videopress-pkg' ),
				{
					a: <ExternalLink href="https://automattic.survey.fm/videopress-feedback" />,
				}
			) }
		</PanelBody>
	);
}
