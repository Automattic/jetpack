/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useVideoData from '../../../../hooks/use-video-data';
import { videoControlProps } from '../../types';
import type React from 'react';

const CHARACTERS_PER_LINE = 31;

/**
 * React component that renders a Video details control
 *
 * @param {videoControlProps} props - Component properties.
 * @returns {React.ReactElement}      Details panel component.
 */
export default function DetailsPanel( { attributes, setAttributes }: videoControlProps ) {
	const { title, description } = attributes;
	const { isRequestingVideoData } = useVideoData( attributes.id );

	// Expands the description textarea to accommodate the description
	const minRows = 4;
	const maxRows = 12;
	const rows = description?.length
		? description
				.split( '\n' )
				.map( line => Math.ceil( line.length / CHARACTERS_PER_LINE ) || 1 )
				.reduce( ( sum, current ) => sum + current, 0 )
		: minRows;

	const descriptionControlRows = Math.min( maxRows, Math.max( rows, minRows ) );

	return (
		<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
			<TextControl
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
				value={ title }
				placeholder={ __( 'Video title', 'jetpack-videopress-pkg' ) }
				onChange={ value => setAttributes( { title: value } ) }
				disabled={ isRequestingVideoData }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
				value={ description }
				placeholder={ __( 'Video description', 'jetpack-videopress-pkg' ) }
				onChange={ value => setAttributes( { description: value } ) }
				rows={ descriptionControlRows }
				disabled={ isRequestingVideoData }
			/>
		</PanelBody>
	);
}
