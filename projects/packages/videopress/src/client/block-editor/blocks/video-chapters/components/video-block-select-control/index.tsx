/**
 * External dependencies
 */
import { PanelRow, SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { PersistentBlockLinkIdProp } from '../../types';

type VideoBlockSelectControlProps = {
	value: PersistentBlockLinkIdProp;
	onChange: ( newvalue: PersistentBlockLinkIdProp ) => void;
};

type VideoBlocksSelectControlItemProps = {
	value: PersistentBlockLinkIdProp;
	label: string;
};

type VideoBlocksSelectControlDataProps = VideoBlocksSelectControlItemProps[];

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

	const availableBlocksListToLink: VideoBlocksSelectControlDataProps = blocks
		.map( block => ( {
			value: block.clientId,
			label: block.attributes.title,
		} ) )
		.filter( data => data.label ); // Avoid to list blocks with no video or not title defined

	if ( ! availableBlocksListToLink.length ) {
		return <PanelRow>{ __( 'No video blocks found.', 'jetpack-videopress-pkg' ) }</PanelRow>;
	}

	const blockToLinkName = availableBlocksListToLink.find( data => data.value === value )?.label;

	const linkedToMessage = sprintf(
		/* translators: %s: The block name to link to. */
		__( 'Linked to %s video', 'jetpack-videopress-pkg' ),
		blockToLinkName
	);

	// Remove the current block from the list of blocks to link to
	availableBlocksListToLink.splice(
		availableBlocksListToLink.findIndex( data => data.value === value ),
		1
	);

	return (
		<>
			<SelectControl
				label={ __( 'Change video link', 'jetpack-videopress-pkg' ) }
				value={ value }
				onChange={ onChange }
				options={ availableBlocksListToLink }
			/>

			<PanelRow>{ linkedToMessage }</PanelRow>
		</>
	);
};

export default VideoBlockSelectControl;
