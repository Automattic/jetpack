import {
	InspectorControls,
	InnerBlocks,
	PanelColorSettings,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { positionLeft, positionRight } from '@wordpress/icons';
import clsx from 'clsx';

export const DEFAULT_BACKGROUND = '#eeeeee';

const Controls = ( { alignment, clientId, toggleAlignment } ) => {
	const parentIsAlternating = useSelect( select => {
		const parentIds = select( 'core/block-editor' ).getBlockParents( clientId );
		const parent = select( 'core/block-editor' ).getBlock( parentIds[ 0 ] );
		return parent?.attributes?.isAlternating;
	} );

	if ( parentIsAlternating === false ) {
		return null;
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () => toggleAlignment( 'left' ) }
					isActive={ alignment === 'left' }
					icon={ positionLeft }
					title={ __( 'Left', 'jetpack-mu-wpcom' ) }
				/>
				<ToolbarButton
					onClick={ () => toggleAlignment( 'right' ) }
					isActive={ alignment === 'right' }
					icon={ positionRight }
					title={ __( 'Right', 'jetpack-mu-wpcom' ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
};

const TimelineItemEdit = ( { attributes, clientId, setAttributes } ) => {
	const style = {
		backgroundColor: attributes.background,
	};

	const bubbleStyle = {
		borderColor: attributes.background,
	};

	const toggleAlignment = alignment => {
		const newAlignment = alignment === attributes.alignment ? 'auto' : alignment;
		setAttributes( { alignment: newAlignment } );
	};

	const classes = clsx( 'wp-block-jetpack-timeline-item', {
		'is-left': attributes.alignment === 'left',
		'is-right': attributes.alignment === 'right',
	} );

	return (
		<>
			<Controls
				alignment={ attributes.alignment }
				clientId={ clientId }
				toggleAlignment={ toggleAlignment }
			/>
			<li style={ style } className={ classes }>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color Settings', 'jetpack-mu-wpcom' ) }
						enableAlpha
						colorSettings={ [
							{
								value: attributes.background,
								onChange: background =>
									setAttributes( { background: background || DEFAULT_BACKGROUND } ),
								label: __( 'Background Color', 'jetpack-mu-wpcom' ),
							},
						] }
					/>
				</InspectorControls>
				<div className="timeline-item">
					<div className="timeline-item__bubble" style={ bubbleStyle } />
					<div className="timeline-item__dot" style={ style } />
					<InnerBlocks template={ [ [ 'core/paragraph' ] ] } />
				</div>
			</li>
		</>
	);
};

export default TimelineItemEdit;
