/**
 * External dependencies
 */
import { SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';

const VideoBlockSelectControl = ( {
	value,
	onChange,
}: {
	value: string;
	onChange: ( blockId: string ) => void;
} ) => {
	const blocks = select( 'core/block-editor' )
		.getBlocks()
		.filter( block => block.name === 'videopress/video' );

	useEffect( () => {
		// Defaults to first option
		if ( ! value && blocks.length > 0 ) {
			onChange( blocks[ 0 ].clientId );
		}
	}, [] );

	const options = blocks.map( block => ( {
		value: block.clientId,
		label: block.attributes.title,
	} ) );

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
