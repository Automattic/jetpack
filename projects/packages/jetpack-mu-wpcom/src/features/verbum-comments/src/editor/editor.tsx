import {
	BlockEditorProvider,
	BlockToolbar,
	BlockTools,
	BlockList,
	Inserter,
	// @ts-expect-error - type definition missing - https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/components/block-canvas/index.js
	BlockCanvas,
	store as blockEditorStore,
} from '@wordpress/block-editor';

import { Popover, SlotFillProvider, KeyboardShortcuts } from '@wordpress/components';
import { useStateWithHistory, useResizeObserver } from '@wordpress/compose';
import { rawShortcut } from '@wordpress/keycodes';

import { useDispatch } from '@wordpress/data';
import { createBlock, type BlockInstance } from '@wordpress/blocks';
import { useState, useEffect } from '@wordpress/element';
import { type MouseEvent } from 'react';

import { classNames } from '../utils';
import inlineStyles from './inline-iframe-style.scss?inline';

/**
 * Gutenberg Editor Settings
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/store/defaults.js
 */
const settings = {
	disableCustomColors: false,
	disableCustomFontSizes: false,
	disablePostFormats: true,
	isDistractionFree: false,
	isRTL: false,
	autosaveInterval: 60,
	codeEditingEnabled: false,
	bodyPlaceholder: 'Leave a comment',
	supportsLayout: false,
	colors: [],
	fontSizes: [],
	imageDefaultSize: 'medium',
	imageSizes: [],
	imageEditing: false,
	hasFixedToolbar: true,
	maxWidth: 580,
	allowedBlockTypes: true,
	maxUploadFileSize: 0,
	allowedMimeTypes: null,
	canLockBlocks: false,
	enableOpenverseMediaCategory: false,
	clearBlockSelection: true,
	__experimentalCanUserUseUnfilteredHTML: false,
	__experimentalBlockDirector: false,
	__mobileEnablePageTemplates: false,
	__experimentalBlockPatterns: [],
	__experimentalBlockPatternCategories: [],
	__unstableGalleryWithImageBlocks: false,
	__unstableIsPreviewMode: false,
	blockInspectorAnimation: {},
	generateAnchors: false,
	gradients: [],
	__unstableResolvedAssets: {
		styles: [],
		scripts: [],
	},
};

interface EditorProps {
	initialContent?: BlockInstance[];
	saveContent: ( content: BlockInstance[] ) => void;
}

/**
 * Editor component
 *
 * @param initialContent.initialContent
 * @param initialContent                Initial content to load into the editor.
 * @param saveContent                   Callback that runs when the editor content changes.
 * @param initialContent.saveContent
 * @return                Instance of the Gutenberg editor with the canvas in an iframe.
 */
export const Editor: React.FC< EditorProps > = ( { initialContent, saveContent } ) => {
	// We keep the content in state so we can access the blocks in the editor.
	const {
		value: editorContent,
		setValue: setEditorContent,
		undo,
		redo,
	} = useStateWithHistory( initialContent || [ createBlock( 'core/paragraph' ) ] );
	const [ isEditing, setIsEditing ] = useState( false );

	// Listen for the content height changing and update the iframe height.
	const [ contentResizeListener, { height: contentHeight } ] = useResizeObserver();

	const { selectBlock } = useDispatch( blockEditorStore );

	const selectLastBlock = ( event?: MouseEvent ) => {
		const lastBlock = editorContent[ editorContent.length - 1 ];

		// If this is a click event only shift focus if the click is in the root.
		// We don't want to shift focus if the click is in a block.
		if ( event ) {
			if ( ( event.target as HTMLDivElement ).dataset.isDropZone ) {
				// If the last block isn't a paragraph, add a new one.
				// This allows the user to add text after a non-text block without clicking the inserter.
				if ( lastBlock.name !== 'core/paragraph' ) {
					const newParagraph = createBlock( 'core/paragraph' );
					handleContentUpdate( [ ...editorContent, createBlock( 'core/paragraph' ) ] );

					selectBlock( newParagraph.clientId );
				}
				selectBlock( lastBlock.clientId );
			} else {
				return;
			}
		}

		selectBlock( lastBlock.clientId );
	};

	const handleContentUpdate = ( content: BlockInstance[] ) => {
		setEditorContent( content );
		saveContent( content );
	};

	useEffect( () => {
		// Select the first item in the editor when it loads.
		selectLastBlock();
		setIsEditing( true );
	}, [] );

	return (
		<SlotFillProvider>
			<KeyboardShortcuts
				bindGlobal={ false }
				shortcuts={ {
					[ rawShortcut.primary( 'z' ) ]: undo,
					[ rawShortcut.primaryShift( 'z' ) ]: redo,
				} }
			>
				<BlockEditorProvider
					settings={ settings }
					value={ editorContent }
					useSubRegistry={ false }
					onInput={ handleContentUpdate }
					onChange={ handleContentUpdate }
				>
					<div className={ classNames( 'editor__header', { 'is-editing': isEditing } ) }>
						<div className="editor__header-wrapper">
							<div className="editor__header-toolbar">
								{ /* @ts-expect-error - type definition missing */ }
								<BlockToolbar hideDragHandle />
							</div>
							{ /* @ts-expect-error - type definition missing */ }
							<Popover.Slot />
						</div>
					</div>
					<div className="editor__main">
						<Popover.Slot />
						<BlockTools>
							<BlockCanvas styles={ [ { css: inlineStyles } ] } height={ contentHeight }>
								<div className="editor__block-canvas-container" onClick={ selectLastBlock }>
									{ contentResizeListener }
									<BlockList renderAppender={ false } />
								</div>
							</BlockCanvas>
						</BlockTools>
					</div>
				</BlockEditorProvider>
			</KeyboardShortcuts>
		</SlotFillProvider>
	);
};
