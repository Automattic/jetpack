/**
 *External dependencies
 */
import { ExternalLink, PanelBody, RadioControl, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
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
	const { autoplay, loop, muted, controls, playsinline, preload } = attributes;

	const handleAttributeChange = useCallback(
		( attributeName: string ) => {
			return newValue => {
				setAttributes( { [ attributeName ]: newValue } );
			};
		},
		[ setAttributes ]
	);

	return (
		<PanelBody title={ __( 'Playback', 'jetpack-videopress-pkg' ) }>
			<ToggleControl
				label={ __( 'Autoplay', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'autoplay' ) }
				checked={ autoplay }
				help={
					<>
						<span className={ styles[ 'help-message' ] }>
							{ __(
								'Start playing the video as soon as the page loads.',
								'jetpack-videopress-pkg'
							) }
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
				}
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

			<RadioControl
				label={ __( 'Preload', 'jetpack-videopress-pkg' ) }
				selected={ preload }
				onChange={ value => setAttributes( { preload: value } ) }
				options={ [
					{
						value: 'metadata',
						label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: 'none',
						label: _x( 'None', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: 'auto',
						label: _x( 'Auto', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
				] }
				help={
					<>
						<span className={ styles[ 'help-message' ] }>
							{ __( 'Content to download before the video is played.', 'jetpack-videopress-pkg' ) }
						</span>
						{ preload === 'auto' && (
							<span className={ styles[ 'help-message' ] }>
								{ __(
									'Note: Automatically downloading videos may cause issues if there are many videos displayed on the same page.',
									'jetpack-videopress-pkg'
								) }
							</span>
						) }
					</>
				}
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
