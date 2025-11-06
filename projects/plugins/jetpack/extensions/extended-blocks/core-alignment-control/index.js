import { AlignmentControl, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n'; // Import for internationalization
import { alignJustify } from '@wordpress/icons'; // Import a justified text icon

// function alignmentControl1( settings, name ) {
// 	if ( 'core/paragraph' === name ) {
// 		console.debug( 'alignmentControl1', settings, name );

// 		// Ensure the 'align' support is enabled and is an array
// 		if ( settings.supports && Array.isArray( settings.supports.align ) ) {
// 			// Check if 'justify' is already in the list to avoid duplication
// 			if ( ! settings.supports.align.includes( 'justify' ) ) {
// 				// Add 'justify' to the list of supported alignments
// 				settings.supports.align.push( 'justify' );
// 			}
// 		} else if ( settings.supports ) {
// 			// If align support is not an array (e.g., it's 'true'),
// 			// replace it with an explicit array including 'justify'.
// 			settings.supports.align = [ 'left', 'center', 'right', 'justify' ];
// 		} else {
// 			// If 'supports' doesn't exist, create it and define align
// 			settings.supports = {
// 				...settings.supports,
// 				align: [ 'left', 'center', 'right', 'justify' ],
// 			};
// 		}
// 	}
// 	return settings;
// }

// addFilter( 'blocks.registerBlockType', 'alignmentControl1', alignmentControl1 );
// // 'editor.BlockEdit' --> bona pinta
// // 'editor.BlockListBlock',
// // 		'blockEditor.useSetting.before',
// // 	'jetpack.externalConnections.extraSettings',
// // 'editor.MediaPlaceholder'
// // 		'blocks.getSaveContent.extraProps',
// // 	'editor.MediaReplaceFlow',

// export const alignmentControl2 = createHigherOrderComponent( BlockEdit => {
// 	return props => {
// 		const { name, attributes, isSelected } = props;
// 		console.debug( 'alignmentControl2 - name', name );
// 		console.debug( 'alignmentControl2 - attributes', attributes );
// 		return <BlockEdit { ...props } />;
// 	};
// }, 'alignmentControl2' );

// addFilter( 'editor.BlockEdit', 'jetpack/alignmentControl2', alignmentControl2 );

// // 1. Define the High-Order Component (HOC)
// const withJustifyControl = createHigherOrderComponent( BlockEdit => {
// 	return props => {
// 		// Only apply this control to the 'core/paragraph' block
// 		if ( props.name !== 'core/paragraph' ) {
// 			return <BlockEdit { ...props } />;
// 		}

// 		const { attributes, setAttributes } = props;
// 		const { align } = attributes;

// 		// Function to toggle the justify alignment
// 		const toggleJustify = () => {
// 			const newAlign = align === 'justify' ? undefined : 'justify';
// 			setAttributes( { align: newAlign } );
// 		};

// 		// Determine if the justify button should appear pressed
// 		const isJustified = align === 'justify';

// 		return (
// 			<Fragment>
// 				{ /* 2. Render the original block editor component */ }
// 				<BlockEdit { ...props } />

// 				{ /* 3. Add the custom control to the block toolbar */ }
// 				<BlockControls>
// 					{ /* Add a new group to the alignment controls */ }
// 					<ToolbarGroup>
// 						<ToolbarButton
// 							icon={ alignJustify } // Use the imported icon
// 							label={ __( 'Justify Text', 'jetpack' ) }
// 							onClick={ toggleJustify }
// 							isPressed={ isJustified }
// 							// Add a class for potential custom styling
// 							className="components-toolbar-control-justify"
// 						/>
// 					</ToolbarGroup>
// 				</BlockControls>
// 			</Fragment>
// 		);
// 	};
// }, 'withJustifyControl' );

// // 4. Apply the HOC using the 'editor.BlockEdit' filter
// addFilter( 'editor.BlockEdit', 'my-plugin/with-justify-control', withJustifyControl );

// TODO: Add the actual css so the text is justified
// TODO: Find an alternative, but this works...
// Add CSS to hide text alignment controls
addFilter(
	'editor.BlockEdit',
	'jetpack/hide-text-align-css',
	BlockEdit => {
		// Add CSS to hide text alignment controls
		if ( ! document.getElementById( 'jetpack-hide-text-align-css' ) ) {
			const style = document.createElement( 'style' );
			style.id = 'jetpack-hide-text-align-css';
			style.textContent = `
                /* Hide text alignment controls */
                :not(.jetpack-enhanced-alignment-control) > .components-dropdown .components-button[aria-label*="${ __(
									'Align text',
									'jetpack'
								) }"] {
                    display: none !important;
                }
            `;
			document.head.appendChild( style );
		}

		return BlockEdit;
	},
	1
);
/**
 * Custom JavaScript to manually render AlignmentControl with 'justify' option
 * for the core/paragraph block.
 */

const JUSTIFY_ALIGNMENT_CONTROL = {
	icon: alignJustify,
	title: __( 'Justify text', 'jetpack' ),
	align: 'justify',
};

// Define the full array of alignment controls (objects)
const ALIGNMENT_CONTROLS = [
	{ icon: 'editor-alignleft', title: __( 'Align text left', 'jetpack' ), align: 'left' },
	{
		icon: 'editor-aligncenter',
		title: __( 'Align text center', 'jetpack' ),
		align: 'center',
	},
	{ icon: 'editor-alignright', title: __( 'Align text right', 'jetpack' ), align: 'right' },
	JUSTIFY_ALIGNMENT_CONTROL,
];

const withEnhancedAlignmentControl = createHigherOrderComponent( BlockEdit => {
	return props => {
		// Only target the core/paragraph block
		if ( props.name !== 'core/paragraph' ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props;
		const { align } = attributes;

		// 1. Manually render the enhanced AlignmentControl
		const customControls = (
			<BlockControls group="block" key="custom-alignment-controls">
				<ToolbarGroup className="jetpack-enhanced-alignment-control">
					<AlignmentControl
						value={ align }
						onChange={ newAlign => setAttributes( { align: newAlign } ) }
						alignmentControls={ ALIGNMENT_CONTROLS }
					/>
				</ToolbarGroup>
			</BlockControls>
		);

		return (
			<Fragment>
				{ customControls }
				<BlockEdit { ...props } />
			</Fragment>
		);
	};
}, 'withEnhancedAlignmentControl' );

// Apply the filter
addFilter(
	'editor.BlockEdit',
	'my-plugin/enhanced-alignment-control',
	withEnhancedAlignmentControl
);
