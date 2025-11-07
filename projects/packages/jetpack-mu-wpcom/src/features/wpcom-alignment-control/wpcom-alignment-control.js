import { AlignmentControl, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { alignCenter, alignJustify, alignLeft, alignRight } from '@wordpress/icons';

import './style.scss';

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
									'jetpack-mu-wpcom'
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
	title: __( 'Justify text', 'jetpack-mu-wpcom' ),
	align: 'justify',
};

// Define the full array of alignment controls (objects)
const ALIGNMENT_CONTROLS = [
	{ icon: alignLeft, title: __( 'Align text left', 'jetpack-mu-wpcom' ), align: 'left' },
	{
		icon: alignCenter,
		title: __( 'Align text center', 'jetpack-mu-wpcom' ),
		align: 'center',
	},
	{ icon: alignRight, title: __( 'Align text right', 'jetpack-mu-wpcom' ), align: 'right' },
	JUSTIFY_ALIGNMENT_CONTROL,
];

const withEnhancedAlignmentControl = createHigherOrderComponent( BlockEdit => {
	return props => {
		// Only target the core/paragraph block -- sure about this!?
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
