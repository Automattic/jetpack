import { InnerBlocks, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import BlockAppender from './block-appender';

const TimelineEdit = ( { clientId, attributes, setAttributes } ) => {
	const { isAlternating } = attributes;
	const className = clsx( 'wp-block-jetpack-timeline', {
		'is-alternating': isAlternating,
	} );

	const blockProps = useBlockProps( { className } );

	const addItem = () => {
		const block = createBlock( 'jetpack/timeline-item' );
		dispatch( 'core/block-editor' ).insertBlock( block, undefined, clientId );
	};

	const toggleAlternate = () => setAttributes( { isAlternating: ! isAlternating } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Timeline settings', 'jetpack-mu-wpcom' ) }>
					<ToggleControl
						label={ __( 'Alternate items', 'jetpack-mu-wpcom' ) }
						onChange={ toggleAlternate }
						checked={ isAlternating }
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...blockProps }>
				<InnerBlocks
					allowedBlocks={ [ 'jetpack/timeline-item' ] }
					template={ [ [ 'jetpack/timeline-item' ] ] }
					renderAppender={ () => <BlockAppender onClick={ addItem } /> }
				/>
			</ul>
		</>
	);
};

export default TimelineEdit;
