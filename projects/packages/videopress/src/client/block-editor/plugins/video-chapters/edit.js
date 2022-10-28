/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { isExtensionEnabled } from '../../extensions';
import DetailsControl from './components/details-control';
import useVideoItem from './hooks/use-video-item';
import { useSyncMedia } from './hooks/use-video-item-update';
import { VIDEO_CHAPTERS_EXTENSION_NAME } from '.';

const withVideoChaptersEdit = createHigherOrderComponent(
	BlockEdit => props => {
		const { attributes, setAttributes } = props;
		const [ videoItem, isRequestingVideoItem ] = useVideoItem( attributes?.id );
		const [ forceInitialState ] = useSyncMedia( attributes );
		const isVideoChaptersEnabled = isExtensionEnabled( VIDEO_CHAPTERS_EXTENSION_NAME );

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

		if ( ! props.name === 'videopress/video' || ! props.attributes?.guid ) {
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
	},
	'withVideoChaptersEdit'
);

export default withVideoChaptersEdit;
