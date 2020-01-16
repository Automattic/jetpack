/**
 * External Dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockType, cloneBlock, getBlockFromExample } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';

export default function BlockStylesPreviewAndSelector( {
	attributes,
	clientId,
	styleOptions,
	onSelectStyle,
	activeStyle,
} ) {
	const block = useSelect( select => {
		const { getBlock } = select( 'core/block-editor' );
		return getBlock( clientId );
	} );

	const type = getBlockType( block.name );

	return (
		<div className="block-editor-block-styles">
			{ styleOptions.map( styleOption => {
				return (
					<div
						key={ styleOption.name }
						className={ classnames( 'block-editor-block-styles__item', {
							'is-active': styleOption.name === activeStyle,
						} ) }
						onClick={ () => {
							onSelectStyle( { style: styleOption.name } );
						} }
						onKeyDown={ event => {
							if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
								event.preventDefault();
								onSelectStyle( { style: styleOption.name } );
							}
						} }
						role="button"
						tabIndex="0"
						aria-label={ styleOption.label }
					>
						<div className="block-editor-block-styles__item-preview editor-styles-wrapper">
							<BlockPreview
								viewportWidth={ 500 }
								blocks={
									type.example
										? getBlockFromExample( block.name, {
												attributes: { ...type.example.attributes, style: styleOption.name },
												innerBlocks: type.example.innerBlocks,
										  } )
										: cloneBlock( block, {
												...attributes,
												style: styleOption.name,
										  } )
								}
							/>
						</div>
						<div className="block-editor-block-styles__item-label">{ styleOption.label }</div>
					</div>
				);
			} ) }
		</div>
	);
}
