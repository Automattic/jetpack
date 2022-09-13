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
import { isVideoChaptersEnabled } from '.';

const withVideoChaptersEdit = createHigherOrderComponent( BlockEdit => props => {
	const [ videoItem, isRequestingVideoItem ] = useVideoItem( props?.attributes?.id );
	const { setAttributes } = props;

	/*
	 * Propagate title and description from the video item
	 * to the block attributes.
	 */
	useEffect( () => {
		if ( ! videoItem ) {
			return;
		}

		setAttributes( {
			title: videoItem?.title,
			description: videoItem?.description,
		} );
	}, [ videoItem, setAttributes ] );

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
