/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Tooltip, SelectControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import SeekbarColorSettings from './seekbar-color-settings';

/**
 * VideoPress block - Inspector control
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {object}                     - React component.
 */
export default function VideoPressInspectorControls( { attributes, setAttributes } ) {
	const { autoplay, loop, muted, controls, playsinline, preload, useAverageColor } = attributes;

	const renderControlLabelWithTooltip = ( label, tooltipText ) => {
		return (
			<Tooltip text={ tooltipText } position="top">
				<span>{ label }</span>
			</Tooltip>
		);
	};

	const handleAttributeChange = useCallback(
		attributeName => {
			return newValue => {
				setAttributes( { [ attributeName ]: newValue } );
			};
		},
		[ setAttributes ]
	);

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Video Settings', 'jetpack-videopress-pkg' ) }>
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Autoplay', 'jetpack-videopress-pkg' ),
						/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
						__( 'Start playing the video as soon as the page loads', 'jetpack-videopress-pkg' )
					) }
					onChange={ handleAttributeChange( 'autoplay' ) }
					checked={ autoplay }
					help={
						autoplay
							? __(
									'Note: Autoplaying videos may cause usability issues for some visitors.',
									'jetpack-videopress-pkg'
							  )
							: null
					}
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
						__( 'Playback Controls', 'jetpack-videopress-pkg' ),
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

			<SeekbarColorSettings
				{ ...{ attributes, setAttributes, useAverageColor } }
				toggleAttribute={ handleAttributeChange }
			/>
		</InspectorControls>
	);
}
