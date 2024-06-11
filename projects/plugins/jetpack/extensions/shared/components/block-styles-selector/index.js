import { BlockControls, BlockPreview, InspectorControls } from '@wordpress/block-editor';
import { getBlockType, getBlockFromExample, createBlock } from '@wordpress/blocks';
import { PanelBody, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER, SPACE } from '@wordpress/keycodes';
import clsx from 'clsx';
import { isEqual } from 'lodash';

import './style.scss';

const addPreviewAttribute = block => {
	return {
		...block,
		attributes: {
			...block.attributes,
			__isBlockPreview: true,
		},
	};
};

const StylePreview = ( { attributes, styleOption, viewportWidth, blockName } ) => {
	const type = getBlockType( blockName );

	return (
		<BlockPreview
			viewportWidth={ viewportWidth }
			blocks={ addPreviewAttribute(
				type.example
					? getBlockFromExample( blockName, {
							attributes: { ...type.example.attributes, style: styleOption.value },
							innerBlocks: type.example.innerBlocks,
					  } )
					: createBlock( blockName, attributes )
			) }
		/>
	);
};

const StylePreviewComponent = memo
	? memo( StylePreview, ( prevProps, nextProps ) => isEqual( prevProps, nextProps ) )
	: StylePreview;

export default function BlockStylesSelector( {
	attributes,
	clientId,
	styleOptions,
	onSelectStyle,
	activeStyle,
	viewportWidth,
	title,
} ) {
	let block;
	if ( useSelect ) {
		block = useSelect( select => {
			const { getBlock } = select( 'core/block-editor' );
			return getBlock( clientId );
		} );
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup
					isCollapsed={ true }
					icon="admin-appearance"
					label={ __( 'Style', 'jetpack' ) }
					controls={ styleOptions.map( styleOption => ( {
						title: styleOption.label,
						isActive: styleOption.value === activeStyle,
						onClick: () => onSelectStyle( { style: styleOption.value } ),
					} ) ) }
					popoverProps={ { className: 'jetpack-block-styles-selector-toolbar' } }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ title ? title : __( 'Styles', 'jetpack' ) }>
					<div className="block-editor-block-styles jetpack-block-styles-selector">
						{ styleOptions.map( styleOption => {
							const optionAttributes = {
								...attributes,
								style: styleOption.value,
							};

							return (
								<div
									key={ styleOption.value }
									className={ clsx( 'block-editor-block-styles__item', {
										'is-active': styleOption.value === activeStyle,
									} ) }
									onClick={ () => {
										onSelectStyle( { style: styleOption.value } );
									} }
									onKeyDown={ event => {
										if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
											event.preventDefault();
											onSelectStyle( { style: styleOption.value } );
										}
									} }
									role="button"
									tabIndex="0"
									aria-label={ styleOption.label }
								>
									<div className="block-editor-block-styles__item-preview">
										{ styleOption.preview
											? styleOption.preview
											: useSelect &&
											  block && (
													<StylePreviewComponent
														blockName={ block.name }
														styleOption={ styleOption }
														attributes={ optionAttributes }
														viewportWidth={ viewportWidth }
													/>
											  ) }
									</div>
									<div className="block-editor-block-styles__item-label">{ styleOption.label }</div>
								</div>
							);
						} ) }
					</div>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
