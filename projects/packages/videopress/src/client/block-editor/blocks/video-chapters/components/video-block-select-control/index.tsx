/**
 * External dependencies
 */
import { PanelRow, SelectControl } from '@wordpress/components';
import { select } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { PersistentBlockLinkIdProp } from '../../types';

type VideoBlockSelectControlProps = {
	linkId: string;
	onChange: ( newvalue: PersistentBlockLinkIdProp ) => void;
};

type VideoBlocksSelectControlItemProps = {
	value: string;
	label: string;
	persistentBlockLinkId: PersistentBlockLinkIdProp;
};

type VideoBlocksSelectControlDataProps = VideoBlocksSelectControlItemProps[];

const VideoBlockSelectControl = ( { linkId, onChange }: VideoBlockSelectControlProps ) => {
	const blocks = select( 'core/block-editor' )
		.getBlocks()
		.filter( block => block.name === 'videopress/video' );

	const onChangeHandler = useCallback(
		( newValue: string ) => {
			onChange( newValue );
		},
		[ onChange ]
	);

	const availableBlocksToLink: VideoBlocksSelectControlDataProps = blocks
		.map( block => ( {
			value: block.clientId,
			label: block.attributes.title,
			persistentBlockLinkId: block.attributes.persistentBlockLinkId,
		} ) )
		.filter( data => data.value && ! data.persistentBlockLinkId );

	/*
	 * Get the current linked video block
	 * based on the linkId attribute.
	 */
	const currentLinkedBlock = blocks.find(
		block => block.attributes?.persistentBlockLinkId === linkId
	);

	/*
	 * Link the chapters block automatically when:
	 * - The chapters block is created (mounted)
	 * - The chapters block is not already linked to a video block
	 * - There is only one video block in the post to link to.
	 */
	useEffect( () => {
		if ( linkId ) {
			return;
		}

		if ( ! availableBlocksToLink || availableBlocksToLink.length !== 1 ) {
			return;
		}

		onChangeHandler( availableBlocksToLink[ 0 ].value );
	}, [ linkId, availableBlocksToLink ] );

	if ( ! availableBlocksToLink.length && ! currentLinkedBlock ) {
		return <PanelRow>{ __( 'No video blocks found.', 'jetpack-videopress-pkg' ) }</PanelRow>;
	}

	/*
	 * Remove the current linked video block
	 * from the available blocks list.
	 */
	if ( linkId ) {
		availableBlocksToLink.splice(
			availableBlocksToLink.findIndex( data => data.value === linkId ),
			1
		);
	}

	const linkedToMessage = currentLinkedBlock
		? sprintf(
				/* translators: %s: The block name to link to. */
				__( 'Linked to %s video', 'jetpack-videopress-pkg' ),
				currentLinkedBlock.attributes?.title
		  )
		: '';

	return (
		<>
			<SelectControl
				label={ __( 'Change video link', 'jetpack-videopress-pkg' ) }
				value={ linkId }
				onChange={ onChangeHandler }
				options={ availableBlocksToLink }
			/>

			{ linkId && <PanelRow>{ linkedToMessage }</PanelRow> }
		</>
	);
};

export default VideoBlockSelectControl;
