/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { isVideoPressBlockBasedOnAttributes } from '../utils';
import TransformControl from './components/transform-control';

const withV6TransformEdit = createHigherOrderComponent( BlockEdit => props => {
	// Only apply to the extended core/video block (v5).
	if ( ! isVideoPressBlockBasedOnAttributes( props.attributes ) ) {
		return <BlockEdit { ...props } />;
	}

	return (
		<>
			<InspectorControls>
				<TransformControl />
			</InspectorControls>

			<BlockEdit { ...props } />
		</>
	);
} );

export default withV6TransformEdit;
