import { BlockControls, PlainText, useBlockProps } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ToolbarButton from './controls';
import MarkdownRenderer from './renderer';

/**
 * Module variables
 */
const PANEL_EDITOR = 'editor';
const PANEL_PREVIEW = 'preview';

const MarkdownEdit = ( { attributes, setAttributes, isSelected, removeBlock } ) => {
	const { source } = attributes;
	const isEmpty = ! source || source.trim() === '';

	const blockProps = useBlockProps();
	const { className } = blockProps;
	const [ activePanel, setActivePanel ] = useState( PANEL_EDITOR );
	const input = useRef( null );

	const onChange = s => setAttributes( { source: s } );
	const onKeyDown = e => {
		// Remove the block if source is empty and we're pressing the Backspace key
		if ( e.keyCode === 8 && source === '' ) {
			removeBlock();
			e.preventDefault();
		}
	};

	useEffect( () => {
		if ( isSelected ) {
			if ( activePanel === PANEL_EDITOR ) {
				input?.current.focus();
			}
		} else if ( activePanel === PANEL_PREVIEW ) {
			setActivePanel( PANEL_EDITOR );
		}
	}, [ isSelected, activePanel, setActivePanel ] );

	let content;

	if ( ! isSelected && isEmpty ) {
		content = (
			<p className={ `${ className }__placeholder` }>
				{ __( 'Write your _Markdown_ **here**…', 'jetpack' ) }
			</p>
		);
	} else {
		content = (
			<div className={ className }>
				<BlockControls>
					<div className="components-toolbar">
						<ToolbarButton
							className={ className }
							label={ __( 'Markdown', 'jetpack' ) }
							isPressed={ activePanel === PANEL_EDITOR }
							onClick={ () => setActivePanel( PANEL_EDITOR ) }
						/>
						<ToolbarButton
							className={ className }
							label={ __( 'Preview', 'jetpack' ) }
							isPressed={ activePanel === PANEL_PREVIEW }
							onClick={ () => setActivePanel( PANEL_PREVIEW ) }
						/>
					</div>
				</BlockControls>

				{ activePanel === PANEL_PREVIEW || ! isSelected ? (
					<MarkdownRenderer className={ `${ className }__preview` } source={ source } />
				) : (
					<PlainText
						className={ `${ className }__editor` }
						onChange={ onChange }
						onKeyDown={ onKeyDown }
						aria-label={ __( 'Markdown', 'jetpack' ) }
						ref={ input }
						value={ source }
					/>
				) }
			</div>
		);
	}

	return <div { ...blockProps }>{ content }</div>;
};

export default compose( [
	withSelect( select => ( {
		currentBlockId: select( 'core/block-editor' ).getSelectedBlockClientId(),
	} ) ),
	withDispatch( ( dispatch, { currentBlockId } ) => ( {
		removeBlock: () => dispatch( 'core/block-editor' ).removeBlocks( currentBlockId ),
	} ) ),
] )( MarkdownEdit );
