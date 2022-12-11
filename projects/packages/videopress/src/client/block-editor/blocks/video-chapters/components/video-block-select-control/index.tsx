/**
 * External dependencies
 */
import { PanelRow, SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { PersistentBlockLinkIdProp } from '../../types';

type VideoBlockSelectControlProps = {
	value: PersistentBlockLinkIdProp;
	onChange: ( newvalue: PersistentBlockLinkIdProp ) => void;
};

const VideoBlockSelectControl = ( { value, onChange }: VideoBlockSelectControlProps ) => {
	const blocks = select( 'core/block-editor' )
		.getBlocks()
		.filter( block => block.name === 'videopress/video' );

	useEffect( () => {
		// Defaults to first option
		if ( ! value && blocks.length > 0 ) {
			onChange( blocks[ 0 ].clientId );
		}
	}, [] );

	const availableBlocksListToLink = blocks
		.map( block => ( {
			value: block.clientId,
			label: block.attributes.title,
		} ) )
		.filter( data => data.label ); // Avoid to list blocks with no video or not title defined

	if ( ! availableBlocksListToLink.length ) {
		return (
			<PanelRow>{ __( 'No VideoPress video blocks found.', 'jetpack-videopress-pkg' ) }</PanelRow>
		);
	}

	return (
		<SelectControl
			label={ __( 'Video', 'jetpack-videopress-pkg' ) }
			value={ value }
			onChange={ onChange }
			options={ availableBlocksListToLink }
		/>
	);
};

export default VideoBlockSelectControl;
