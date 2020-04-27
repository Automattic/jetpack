/**
 * External Dependencies
 */
import { find } from 'lodash';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { TextControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { childBlocks } from '../index';

const withAdvancedControls = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { attributes, setAttributes, isSelected } = props;

		const { id } = attributes;

		// Remove the jetpack/ from each block name to perform the matching.
		if ( ! find( childBlocks, [ 'name', props.name.split( '/' )[ 1 ] ] ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				{ isSelected && (
					<InspectorAdvancedControls>
						<TextControl
							label={ __( 'Unique CSS ID', 'jetpack' ) }
							value={ id }
							onChange={ value => setAttributes( { id: value } ) }
							help={ __( 'A unique ID that can be used in CSS or as an anchor.', 'jetpack' ) }
						/>
					</InspectorAdvancedControls>
				) }
			</>
		);
	};
}, 'withAdvancedControls' );

addFilter( 'editor.BlockEdit', 'jetpack/contact-form', withAdvancedControls );
