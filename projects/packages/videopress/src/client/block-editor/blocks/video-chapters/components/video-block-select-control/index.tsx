/**
 * External dependencies
 */
import { PanelRow, SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { PersistentBlockLinkIdProp } from '../../types';

type VideoBlockSelectControlProps = {
	value: string;
	onChange: ( newvalue: PersistentBlockLinkIdProp ) => void;
};

type VideoBlocksSelectControlItemProps = {
	value: string;
	label: string;
};

type VideoBlocksSelectControlDataProps = VideoBlocksSelectControlItemProps[];

const VideoBlockSelectControl = ( { value, onChange }: VideoBlockSelectControlProps ) => {
	const blocks = select( 'core/block-editor' )
		.getBlocks()
		.filter( block => block.name === 'videopress/video' );

	useEffect( () => {
		if ( ! value && blocks.length > 0 ) {
			onChange( blocks[ 0 ].clientId );
		}
	}, [] );

	const availableBlocksToLink: VideoBlocksSelectControlDataProps = blocks
		.map( block => ( {
			value: block.clientId,
			label: block.attributes.title,
			persistentBlockLinkId: block.attributes.persistentBlockLinkId,
		} ) )
		.filter( data => data.label );

	if ( ! availableBlocksToLink.length ) {
		return <PanelRow>{ __( 'No video blocks found.', 'jetpack-videopress-pkg' ) }</PanelRow>;
	}

	const blockToLinkName = availableBlocksToLink.find( data => data.value === value )?.label;

	const linkedToMessage = sprintf(
		/* translators: %s: The block name to link to. */
		__( 'Linked to %s video', 'jetpack-videopress-pkg' ),
		blockToLinkName
	);

	// Remove the current block from the list of blocks to link to
	availableBlocksToLink.splice(
		availableBlocksToLink.findIndex( data => data.value === value ),
		1
	);

	return (
		<>
			<SelectControl
				label={ __( 'Change video link', 'jetpack-videopress-pkg' ) }
				value={ value }
				onChange={ onChange }
				options={ availableBlocksToLink }
			/>

			<PanelRow>{ linkedToMessage }</PanelRow>
		</>
	);
};

export default VideoBlockSelectControl;
