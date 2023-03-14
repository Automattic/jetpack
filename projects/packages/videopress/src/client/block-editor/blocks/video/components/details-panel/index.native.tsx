/**
 * WordPress dependencies
 */
import { PanelBody, TextControl, BottomSheetTextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoControlProps } from '../../types';
/**
 * Types
 */
import type React from 'react';

/**
 * React component that renders the details settings panel.
 *
 * @param {VideoControlProps} props - Component properties.
 * @returns {React.ReactElement}	- Details panel component.
 */
export default function DetailsPanel( { attributes, setAttributes }: VideoControlProps ) {
	const { title, description } = attributes;

	return (
		<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
			<TextControl
				value={ title || '' }
				onChange={ value => setAttributes( { title: value } ) }
				placeholder={ __( 'Add title', 'jetpack-videopress-pkg' ) }
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
			/>
			<BottomSheetTextControl
				initialValue={ description }
				onChange={ value => setAttributes( { description: value } ) }
				placeholder={ __( 'Add description', 'jetpack-videopress-pkg' ) }
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
			/>
		</PanelBody>
	);
}
