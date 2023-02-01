/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import TransformControl from './components/transform-control';

const withV6TransformEdit = createHigherOrderComponent( BlockEdit => props => {
	if ( ! props.attributes?.guid ) {
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
