/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import DetailsControl from './components/details-control';
import useVideoItem from './hooks/use-video-item';
import { useSyncMedia } from './hooks/use-video-item-update';
import { isVideoChaptersEnabled } from '.';

const withVideoChaptersEdit = createHigherOrderComponent( BlockEdit => props => {
	const { attributes, setAttributes } = props;
	const [ videoItem, isRequestingVideoItem ] = useVideoItem( attributes?.id );
	const [ forceInitialState ] = useSyncMedia( attributes );

	/*
	 * Propagate title and description from
	 * the video item (metadata) to the block attributes.
	 */
	useEffect( () => {
		if ( ! videoItem ) {
			return;
		}

		const freshAttributes = {};

		if ( videoItem?.title ) {
			freshAttributes.title = videoItem.title;
		}

		if ( videoItem?.description ) {
			freshAttributes.description = videoItem.description;
		}

		if ( ! Object.keys( freshAttributes ).length ) {
			return;
		}

		setAttributes( freshAttributes );
		forceInitialState( freshAttributes );
	}, [ videoItem, setAttributes, forceInitialState ] );

	if ( ! isVideoChaptersEnabled ) {
		return <BlockEdit { ...props } />;
	}

	if ( ! props.name === 'core/video' || ! props.attributes?.guid ) {
		return <BlockEdit { ...props } />;
	}

	return (
		<>
			<InspectorControls>
				<DetailsControl isRequestingVideoItem={ isRequestingVideoItem } />
			</InspectorControls>

			<BlockEdit { ...props } />
		</>
	);
} );

export default withVideoChaptersEdit;
