/* @jsxImportSource react */
// First: it sets the translations the modules below read as they load.
import './locale';
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	ObserveTyping,
	WritingFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import * as code from '@wordpress/block-library/build-module/code/index.mjs';
import * as list from '@wordpress/block-library/build-module/list/index.mjs';
import * as listItem from '@wordpress/block-library/build-module/list-item/index.mjs';
import * as paragraph from '@wordpress/block-library/build-module/paragraph/index.mjs';
import * as quote from '@wordpress/block-library/build-module/quote/index.mjs';
import {
	createBlock,
	isUnmodifiedDefaultBlock,
	parse,
	serialize,
	setDefaultBlockName,
	type Block,
} from '@wordpress/blocks';
import { Button, Popover, SlotFillProvider } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Component,
	createRoot,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';
import '@wordpress/format-library';
import { unregisterFormatType } from '@wordpress/rich-text';
import { history } from './history';
import { BlockToolbar } from './toolbar';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import './style.scss';

// The chunk runs once per page, however many forms it serves.
[ paragraph, list, listItem, quote, code ].forEach( block => block.init() );
setDefaultBlockName( paragraph.name );
// Formats whose markup kses strips from a comment, so none is offered.
[
	'core/image',
	'core/underline',
	'core/text-color',
	'core/subscript',
	'core/superscript',
	'core/keyboard',
	'core/language',
	'core/math',
].forEach( name => unregisterFormatType( name ) );

const settings = {
	isRTL: document.documentElement.dir === 'rtl',
	hasFixedToolbar: true,
	// A comment has no wide or full width.
	supportsLayout: false,
};

type EditorProps = {
	initialContent: string;
	/** Accessible names, translated in PHP. */
	labels: { blockTools: string; addParagraph: string };
	focus: boolean;
	placeholder: string;
	onChange: ( content: string ) => void;
	/** The editor broke; the caller brings its textarea back. */
	onError: () => void;
};

type BoundaryProps = { onError: () => void; children: ReactNode };

// A render error would otherwise leave an empty box where the textarea was.
class Boundary extends Component< BoundaryProps, { failed: boolean } > {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		return this.state.failed ? null : this.props.children;
	}
}

// The reader clicked into the textarea to get here, so the caret goes to the end.
const FocusOnMount = () => {
	const { selectBlock } = useDispatch( blockEditorStore );
	const last = useSelect( select => select( blockEditorStore ).getBlockOrder().at( -1 ), [] );
	const done = useRef( false );

	// The provider hands its blocks to the store after the first render.
	useEffect( () => {
		if ( last && ! done.current ) {
			done.current = true;
			selectBlock( last, -1 );
		}
	}, [ last, selectBlock ] );

	return null;
};

// The "+" from @wordpress/icons, a large package for one icon.
const plus = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" />
	</svg>
);

// Core's appender shows only in an empty editor, which strands the caret in a last code block.
// Hidden under an empty paragraph, so clicks don't stack them.
const Appender = ( { label }: { label: string } ) => {
	const isNeeded = useSelect( select => {
		const { getBlockOrder, getBlock } = select( blockEditorStore );
		const last = getBlock( getBlockOrder().at( -1 ) ?? '' );

		return !! last && ! isUnmodifiedDefaultBlock( last, 'content' );
	}, [] );
	const { insertDefaultBlock, clearSelectedBlock } = useDispatch( blockEditorStore );
	const onClick = useCallback( () => insertDefaultBlock(), [ insertDefaultBlock ] );
	// Or WritingFlow takes Enter here to split the block above.
	const onFocus = useCallback( () => clearSelectedBlock(), [ clearSelectedBlock ] );
	// A click goes straight to a new block, without the toolbar closing in between.
	const onMouseDown = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => event.preventDefault(),
		[]
	);

	if ( ! isNeeded ) {
		return null;
	}

	return (
		// WritingFlow turns editable for a selection across blocks.
		<div className="jetpack-comments__appender" contentEditable={ false }>
			<Button
				icon={ plus }
				label={ label }
				size="small"
				onClick={ onClick }
				onFocus={ onFocus }
				onMouseDown={ onMouseDown }
			/>
		</div>
	);
};

type WritingAreaProps = { undo: () => void; redo: () => void; children: ReactNode };

// The undo and redo shortcuts, which live in the post editor, not the block editor.
const WritingArea = ( { undo, redo, children }: WritingAreaProps ) => {
	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'z' ) {
				event.preventDefault();
				if ( event.shiftKey ) {
					redo();
				} else {
					undo();
				}
			}
		},
		[ undo, redo ]
	);

	return <div onKeyDownCapture={ onKeyDown }>{ children }</div>;
};

const Editor = ( {
	initialContent,
	labels,
	focus,
	placeholder,
	onChange,
}: Omit< EditorProps, 'onError' > ) => {
	const [ { present }, dispatch ] = useReducer( history, null, () => {
		// A draft from the editor is block markup; anything else is plain text for one paragraph.
		const blocks = initialContent.includes( '<!-- wp:' )
			? parse( initialContent )
			: [
					createBlock( 'core/paragraph', {
						placeholder,
						content: initialContent
							.trim()
							.replace( /&/g, '&amp;' )
							.replace( /</g, '&lt;' )
							.replace( /\n/g, '<br>' ),
					} ),
				];

		return { past: [], present: { blocks, markup: serialize( blocks ) }, future: [], editedAt: 0 };
	} );
	const { blocks, markup } = present;

	// Here, not in the handlers below, so an undo reaches the form too.
	useEffect( () => {
		// Empty paragraphs serialize to markup, which is not a comment.
		onChange(
			blocks.every(
				( { name, attributes } ) =>
					name === 'core/paragraph' && ! String( attributes.content ?? '' ).trim()
			)
				? ''
				: markup
		);
	}, [ blocks, markup, onChange ] );

	const onEdit = useCallback(
		( next: Block[] ) => dispatch( { type: 'edit', blocks: next, at: Date.now() } ),
		[]
	);
	const undo = useCallback( () => dispatch( { type: 'undo' } ), [] );
	const redo = useCallback( () => dispatch( { type: 'redo' } ), [] );
	// Backspace just after a shortcut such as "- " calls this to undo the conversion.
	const editorSettings = useMemo( () => ( { ...settings, __experimentalUndo: undo } ), [ undo ] );

	return (
		<SlotFillProvider>
			<BlockEditorProvider
				value={ blocks }
				onInput={ onEdit }
				onChange={ onEdit }
				settings={ editorSettings }
				useSubRegistry
			>
				{ focus && <FocusOnMount /> }
				<WritingArea undo={ undo } redo={ redo }>
					<div className="jetpack-comments__toolbar">
						<BlockToolbar label={ labels.blockTools } />
					</div>
					{ /* In the page, not an iframe, so the blocks wear the theme's type. */ }
					<BlockTools>
						<WritingFlow className="editor-styles-wrapper">
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
							<Appender label={ labels.addParagraph } />
						</WritingFlow>
					</BlockTools>
				</WritingArea>
				<Popover.Slot />
			</BlockEditorProvider>
		</SlotFillProvider>
	);
};

/**
 * Replace the comment textarea's typing with the block editor.
 *
 * @param container - Where the editor renders.
 * @param props     - Editor props.
 */
export const mountEditor = ( container: HTMLElement, props: EditorProps ) => {
	createRoot( container ).render(
		<Boundary onError={ props.onError }>
			<Editor { ...props } />
		</Boundary>
	);
};
