/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { isExtensionEnabled } from '../../extensions';
import useVideoItem from '../../hooks/use-video-item';
import { useSyncMedia } from '../../hooks/use-video-item-update';
import DetailsControl from './components/details-control';
import { VIDEO_CHAPTERS_EXTENSION_NAME } from '.';

const withVideoChaptersEdit = createHigherOrderComponent(
	BlockEdit => props => {
		const { attributes, setAttributes } = props;
		const [ isRequestingVideoItem ] = useVideoItem( attributes?.id );
		useSyncMedia( attributes, setAttributes, [ 'title', 'description' ] );
		const isVideoChaptersEnabled = isExtensionEnabled( VIDEO_CHAPTERS_EXTENSION_NAME );

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
