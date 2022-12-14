/**
 * External dependencies
 */
import { SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';

const VideoBlockSelectControl = ( { value, onChange } ) => {
	const blocks = select( 'core/block-editor' )
		.getBlocks()
		.filter( block => block.name === 'videopress/video' );

	useEffect( () => {
		// Defaults to first option
		if ( ! value && blocks.length > 0 ) {
			onChange( blocks[ 0 ].clientId );
		}
	}, [] );

	const options = blocks
		.map( block => ( {
			value: block.clientId,
			label: block.attributes.title,
		} ) )
		.filter( data => data.label ); // Avoid to list blocks with no video or not title defined

	return (
		<SelectControl
			label={ __( 'Video', 'jetpack-videopress-pkg' ) }
			value={ value }
			onChange={ onChange }
			options={ options }
		/>
	);
};

export default VideoBlockSelectControl;
