/**
 *External dependencies
 */
import { Tooltip, PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoControlProps } from '../../types';
import type React from 'react';

export const renderControlLabelWithTooltip = ( label, tooltipText ) => {
	return (
		<Tooltip text={ tooltipText } position="top left">
			<span>{ label }</span>
		</Tooltip>
	);
};

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
				label={ renderControlLabelWithTooltip(
					__( 'Autoplay', 'jetpack-videopress-pkg' ),
					/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
					__( 'Start playing the video as soon as the page loads', 'jetpack-videopress-pkg' )
				) }
				onChange={ handleAttributeChange( 'autoplay' ) }
				checked={ autoplay }
				help={ __(
					'Note: Autoplaying videos may cause usability issues for some visitors.',
					'jetpack-videopress-pkg'
				) }
			/>

			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Loop', 'jetpack-videopress-pkg' ),
					/* translators: Tooltip describing the "loop" option for the VideoPress player */
					__( 'Restarts the video when it reaches the end', 'jetpack-videopress-pkg' )
				) }
				onChange={ handleAttributeChange( 'loop' ) }
				checked={ loop }
			/>

			<ToggleControl
				label={ __( 'Muted', 'jetpack-videopress-pkg' ) }
				onChange={ handleAttributeChange( 'muted' ) }
				checked={ muted }
			/>

			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Show Controls', 'jetpack-videopress-pkg' ),
					/* translators: Tooltip describing the "controls" option for the VideoPress player */
					__( 'Display the video playback controls', 'jetpack-videopress-pkg' )
				) }
				onChange={ handleAttributeChange( 'controls' ) }
				checked={ controls }
			/>

			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Play Inline', 'jetpack-videopress-pkg' ),
					/* translators: Tooltip describing the "playsinline" option for the VideoPress player */
					__(
						'Play the video inline instead of full-screen on mobile devices',
						'jetpack-videopress-pkg'
					)
				) }
				onChange={ handleAttributeChange( 'playsinline' ) }
				checked={ playsinline }
			/>

			<SelectControl
				label={ renderControlLabelWithTooltip(
					__( 'Preload', 'jetpack-videopress-pkg' ),
					/* translators: Tooltip describing the "preload" option for the VideoPress player */
					__( 'Content to dowload before the video is played', 'jetpack-videopress-pkg' )
				) }
				value={ preload }
				onChange={ value => setAttributes( { preload: value } ) }
				options={ [
					{
						value: 'auto',
						label: _x( 'Auto', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: 'metadata',
						label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: 'none',
						label: _x( 'None', 'VideoPress preload setting', 'jetpack-videopress-pkg' ),
					},
				] }
				help={
					'auto' === preload
						? __(
								'Note: Automatically downloading videos may cause issues if there are many videos displayed on the same page.',
								'jetpack-videopress-pkg'
						  )
						: null
				}
			/>
		</PanelBody>
	);
}
