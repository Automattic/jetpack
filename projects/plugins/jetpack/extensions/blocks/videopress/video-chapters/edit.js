/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import DetailsControl from './components/details-control';
import useVideoItem from './hooks/use-video-item';
import { isVideoChaptersEnabled } from '.';

const withVideoChaptersEdit = createHigherOrderComponent( BlockEdit => props => {
	const [ isRequestingVideoItem ] = useVideoItem( props?.attributes?.id );

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
