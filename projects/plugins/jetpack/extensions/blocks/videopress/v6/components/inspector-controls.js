/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Tooltip, SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import AutoplayControl from './autoplay-control';
import HoverEffectControl from './hover-effect-control';
/**
 * Internal dependencies
 */
import SeekbarColorSettings from './seekbar-color-settings';

export const renderControlLabelWithTooltip = ( label, tooltipText ) => {
	return (
		<Tooltip text={ tooltipText } position="top">
			<span>{ label }</span>
		</Tooltip>
	);
};

export default function VideoPressInspectorControls( {
	attributes,
	setAttributes,
	videoDuration,
} ) {
	const { loop, muted, controls, playsinline, preload, useAverageColor } = attributes;

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
			<PanelBody title={ __( 'General Settings', 'jetpack' ) }>
				<AutoplayControl
					attributes={ attributes }
					setAttributes={ setAttributes }
					videoDuration={ videoDuration }
				/>

				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Loop', 'jetpack' ),
						/* translators: Tooltip describing the "loop" option for the VideoPress player */
						__( 'Restarts the video when it reaches the end', 'jetpack' )
					) }
					onChange={ handleAttributeChange( 'loop' ) }
					checked={ loop }
				/>
				<ToggleControl
					label={ __( 'Muted', 'jetpack' ) }
					onChange={ handleAttributeChange( 'muted' ) }
					checked={ muted }
				/>
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Playback Controls', 'jetpack' ),
						/* translators: Tooltip describing the "controls" option for the VideoPress player */
						__( 'Display the video playback controls', 'jetpack' )
					) }
					onChange={ handleAttributeChange( 'controls' ) }
					checked={ controls }
				/>
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Play Inline', 'jetpack' ),
						/* translators: Tooltip describing the "playsinline" option for the VideoPress player */
						__( 'Play the video inline instead of full-screen on mobile devices', 'jetpack' )
					) }
					onChange={ handleAttributeChange( 'playsinline' ) }
					checked={ playsinline }
				/>
				<SelectControl
					label={ renderControlLabelWithTooltip(
						__( 'Preload', 'jetpack' ),
						/* translators: Tooltip describing the "preload" option for the VideoPress player */
						__( 'Content to dowload before the video is played', 'jetpack' )
					) }
					value={ preload }
					onChange={ value => setAttributes( { preload: value } ) }
					options={ [
						{ value: 'auto', label: _x( 'Auto', 'VideoPress preload setting', 'jetpack' ) },
						{
							value: 'metadata',
							label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack' ),
						},
						{ value: 'none', label: _x( 'None', 'VideoPress preload setting', 'jetpack' ) },
					] }
					help={
						'auto' === preload
							? __(
									'Note: Automatically downloading videos may cause issues if there are many videos displayed on the same page.',
									'jetpack'
							  )
							: null
					}
				/>
			</PanelBody>

			<PanelBody title={ __( 'Effect Settings', 'jetpack' ) }>
				<HoverEffectControl
					attributes={ attributes }
					setAttributes={ setAttributes }
					videoDuration={ videoDuration }
				/>
			</PanelBody>

			<SeekbarColorSettings
				{ ...{ attributes, setAttributes, useAverageColor } }
				toggleAttribute={ handleAttributeChange }
			/>
		</InspectorControls>
	);
}
