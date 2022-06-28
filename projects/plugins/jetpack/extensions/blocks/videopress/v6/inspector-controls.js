/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function VideoPressInspectorControls( { attributes, setAttributes } ) {
	const { controls, src, guid } = attributes;

	const renderControlLabelWithTooltip = ( label, tooltipText ) => {
		return (
			<Tooltip text={ tooltipText } position="top">
				<span>{ label }</span>
			</Tooltip>
		);
	};

	const handleAttributeChange = attributeName => {
		return newValue => {
			setAttributes( { [ attributeName ]: newValue } );
		};
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Playback Controls', 'jetpack' ),
						/* translators: Tooltip describing the "controls" option for the VideoPress player */
						__( 'Display the video playback controls', 'jetpack' )
					) }
					onChange={ handleAttributeChange( 'controls' ) }
					checked={ controls }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
