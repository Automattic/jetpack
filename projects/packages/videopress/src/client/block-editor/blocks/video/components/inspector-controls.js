/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { Tooltip } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import PlaybackControl from './playback-control';
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

/**
 * VideoPress block - Inspector control
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {object}                     - React component.
 */
export default function VideoPressInspectorControls( { attributes, setAttributes } ) {
	const { useAverageColor } = attributes;
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
			<PlaybackControl attributes={ attributes } setAttributes={ setAttributes } />

			<SeekbarColorSettings
				{ ...{ attributes, setAttributes, useAverageColor } }
				toggleAttribute={ handleAttributeChange }
			/>
		</InspectorControls>
	);
}
