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
/**
 * Types
 */
import type React from 'react';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
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
						<p>
							{ __(
								'Start playing the video as soon as the page loads.',
								'jetpack-videopress-pkg'
							) }
						</p>
						{ autoplay && (
							<p>
								{ __(
									'Note: Autoplaying videos may cause usability issues for some visitors.',
									'jetpack-videopress-pkg'
								) }
							</p>
						) }
					</>
				}
			/>

			<ToggleControl
				label={ __( 'Loop', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'loop' ) }
				checked={ loop }
				help={ __( 'Restarts the video when it reaches the end', 'jetpack-videopress-pkg' ) }
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
				help={ __( 'Display the video playback controls', 'jetpack-videopress-pkg' ) }
			/>

			<ToggleControl
				label={ __( 'Play Inline', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'playsinline' ) }
				checked={ playsinline }
				help={ __(
					'Play the video inline instead of full-screen on mobile devices',
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
						<p>
							{ __( 'Content to download before the video is played', 'jetpack-videopress-pkg' ) }
						</p>
						{ preload === 'auto' && (
							<p>
								{ __(
									'Note: Automatically downloading videos may cause issues if there are many videos displayed on the same page.',
									'jetpack-videopress-pkg'
								) }
							</p>
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
