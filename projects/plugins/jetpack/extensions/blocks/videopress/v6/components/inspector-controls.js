/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Panel,
	PanelBody,
	ToggleControl,
	Tooltip,
	SelectControl,
	RangeControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import SeekbarColorSettings from './seekbar-color-settings';

export default function VideoPressInspectorControls( { attributes, setAttributes } ) {
	const {
		autoplay,
		loop,
		muted,
		controls,
		playsinline,
		preload,
		useAverageColor,
		autoplayHovering,
		autoplayHoveringStart,
		autoplayHoveringDuration,
	} = attributes;

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

	/* translators: Tooltip describing the "controls" option for the VideoPress player */
	const autoplayHoveringHelp = __(
		'The video will be automatically played when hovering over it, and stopped when leaving.',
		'jetpack'
	);

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Autoplay', 'jetpack' ),
						/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
						__( 'Start playing the video as soon as the page loads', 'jetpack' )
					) }
					onChange={ handleAttributeChange( 'autoplay' ) }
					checked={ autoplay }
					help={
						autoplay
							? __(
									'Note: Autoplaying videos may cause usability issues for some visitors.',
									'jetpack'
							  )
							: null
					}
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

			<Panel>
				<PanelBody title={ __( 'Interactive autoplay', 'jetpack' ) } initialOpen={ true }>
					<ToggleControl
						label={ renderControlLabelWithTooltip(
							__( 'Autoplay when hovering', 'jetpack' ),
							autoplayHoveringHelp
						) }
						onChange={ handleAttributeChange( 'autoplayHovering' ) }
						checked={ autoplayHovering }
						help={ autoplayHoveringHelp }
					/>
					{ autoplayHovering && (
						<>
							<RangeControl
								label={ __( 'Start', 'jetpack' ) }
								value={ autoplayHoveringStart }
								onChange={ newStartTime =>
									setAttributes( {
										autoplayHoveringStart: newStartTime,
									} )
								}
								min={ 0 }
								max={ 100 }
								required
								withInputField={ false }
							/>

							<RangeControl
								label={ __( 'Duration [seconds]', 'jetpack' ) }
								value={ autoplayHoveringDuration }
								onChange={ newDuration =>
									setAttributes( {
										autoplayHoveringDuration: newDuration,
									} )
								}
								min={ 0 }
								max={ 10 }
								required
								withInputField={ false }
							/>
						</>
					) }
				</PanelBody>
			</Panel>

			<SeekbarColorSettings
				{ ...{ attributes, setAttributes, useAverageColor } }
				toggleAttribute={ handleAttributeChange }
			/>
		</InspectorControls>
	);
}
