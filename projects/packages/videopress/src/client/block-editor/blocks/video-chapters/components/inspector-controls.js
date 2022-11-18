/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import VideoBlockSelectControl from './video-block-select-control';
import VideoChaptersStyleControl from './video-chapters-style-control';

/**
 * VideoPressChapters block - Inspector control
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {object}                     - React component.
 */
export default function VideoPressChaptersInspectorControls( { attributes, setAttributes } ) {
	const { videoPressBlockId, style } = attributes;

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
			<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
				<VideoBlockSelectControl
					value={ videoPressBlockId }
					onChange={ handleAttributeChange( 'videoPressBlockId' ) }
				/>

				<VideoChaptersStyleControl value={ style } onChange={ handleAttributeChange( 'style' ) } />
			</PanelBody>
		</InspectorControls>
	);
}
