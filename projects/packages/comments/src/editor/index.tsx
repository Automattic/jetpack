/* @jsxImportSource react */
// First: it sets the translations the modules below read as they load.
import './locale';
import {
	BlockControls,
	BlockEditorProvider,
	BlockList,
	BlockMover,
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
	getBlockType,
	parse,
	serialize,
	setDefaultBlockName,
	switchToBlockType,
	type Block,
} from '@wordpress/blocks';
import {
	DropdownMenu,
	Popover,
	SlotFillProvider,
	Toolbar,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Component,
	createRoot,
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from '@wordpress/element';
import '@wordpress/format-library';
import { unregisterFormatType } from '@wordpress/rich-text';
import type { ComponentProps, KeyboardEvent, MouseEvent, ReactNode } from 'react';

type IconType = ComponentProps< typeof DropdownMenu >[ 'icon' ];

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
	__experimentalFeatures: { typography: { textAlign: true } },
};

type EditorProps = {
	initialContent: string;
	/** The toolbars' accessible names, translated in PHP. */
	labels: { blockTools: string; formatTools: string };
	focus: boolean;
	placeholder: string;
	onChange: ( content: string ) => void;
	/** The editor broke; the caller brings its textarea back. */
	onError: () => void;
};

type Step = { blocks: Block[]; markup: string };
type History = {
	past: Step[];
	present: Step;
	future: Step[];
	/** When the present step last changed; 0 after an undo or redo. */
	editedAt: number;
};
type HistoryAction =
	{ type: 'edit'; blocks: Block[]; at: number } | { type: 'undo' } | { type: 'redo' };

/**
 * Which blocks there are, at every depth: typing keeps it, a new or removed block does not.
 *
 * @param blocks - Blocks.
 * @return Their shape.
 */
const shape = ( blocks: Block[] ): string =>
	blocks.map( block => `${ block.clientId }(${ shape( block.innerBlocks ) })` ).join();

/**
 * The comment's undo history: the post editor's lives outside the block editor. A burst
 * of edits to the same blocks is one step; a new block or a pause starts the next.
 *
 * @param state  - History so far.
 * @param action - What happened.
 * @return The history after it.
 */
const history = ( state: History, action: HistoryAction ): History => {
	const { past, present, future, editedAt } = state;

	if ( action.type === 'undo' ) {
		return past.length
			? {
					past: past.slice( 0, -1 ),
					present: past.at( -1 )!,
					future: [ present, ...future ],
					editedAt: 0,
				}
			: state;
	}

	if ( action.type === 'redo' ) {
		return future.length
			? { past: [ ...past, present ], present: future[ 0 ], future: future.slice( 1 ), editedAt: 0 }
			: state;
	}

	// The one serialize an edit costs. Unchanged markup is a selection move, or the editor
	// handing back what an undo restored; recording either would drop the redo steps.
	const markup = serialize( action.blocks );
	if ( markup === present.markup ) {
		return state;
	}

	const extendsStep =
		action.at - editedAt < 1000 && shape( action.blocks ) === shape( present.blocks );

	return {
		// A comment needs no more than 100 steps.
		past: extendsStep ? past : [ ...past, present ].slice( -100 ),
		present: { blocks: action.blocks, markup },
		future: [],
		editedAt: action.at,
	};
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

// The toolbar across the top: what to do with the selected block. Formatting has its
// own popover at the selection, so this renders every block controls group but that one.
const BlockToolbar = ( { label }: { label: string } ) => {
	const { clientIds, root } = useSelect( select => {
		const { getSelectedBlockClientIds, getBlock, getBlockHierarchyRootClientId } =
			select( blockEditorStore );
		const selected = getSelectedBlockClientIds();

		return {
			clientIds: selected,
			root: selected.length ? getBlock( getBlockHierarchyRootClientId( selected[ 0 ] ) ) : null,
		};
	}, [] );
	const { replaceBlocks } = useDispatch( blockEditorStore );

	if ( ! root ) {
		return null;
	}

	// Gutenberg's own switcher is not exported, so the comment offers its four blocks.
	const type = getBlockType( root.name )!;
	const controls = [ 'core/paragraph', 'core/list', 'core/quote', 'core/code' ].flatMap( name => {
		const blocks = name === root.name ? null : switchToBlockType( root, name );
		const target = getBlockType( name )!;

		return blocks
			? [
					{
						title: target.title,
						icon: ( target.icon as { src: IconType } ).src,
						onClick: () => replaceBlocks( root.clientId, blocks ),
					},
				]
			: [];
	} );

	return (
		<Toolbar label={ label } variant="unstyled" className="jetpack-comments__block-tools">
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps: object ) => (
						<DropdownMenu
							toggleProps={ toggleProps }
							icon={ ( type.icon as { src: IconType } ).src }
							label={ type.title }
							controls={ controls }
						/>
					) }
				</ToolbarItem>
				<BlockMover clientIds={ clientIds } hideDragHandle />
			</ToolbarGroup>
			<BlockControls.Slot group="parent" />
			<BlockControls.Slot group="block" />
			<BlockControls.Slot />
			<BlockControls.Slot group="other" />
		</Toolbar>
	);
};

type Anchor = { getBoundingClientRect: () => DOMRect; ownerDocument: Document };

// The formatting tools, in a popover at selected text: above it, or below on a touch
// screen, where the system's own copy and paste menu sits above.
const FormatToolbar = ( { label }: { label: string } ) => {
	const marker = useRef< HTMLSpanElement >( null );
	const [ anchor, setAnchor ] = useState< Anchor | null >( null );

	useEffect( () => {
		const doc = marker.current!.ownerDocument;
		const editor = marker.current!.closest( '.jetpack-comments__editor' );

		const onSelectionChange = () => {
			const selection = doc.getSelection();
			const node = selection?.anchorNode;
			const editable = ( node instanceof Element ? node : node?.parentElement )?.closest(
				'[contenteditable="true"]'
			);

			if ( ! selection || selection.isCollapsed || ! editable || ! editor?.contains( editable ) ) {
				setAnchor( null );
				return;
			}

			const range = selection.getRangeAt( 0 ).cloneRange();
			setAnchor( {
				getBoundingClientRect: () => range.getBoundingClientRect(),
				ownerDocument: doc,
			} );
		};

		doc.addEventListener( 'selectionchange', onSelectionChange );
		return () => doc.removeEventListener( 'selectionchange', onSelectionChange );
	}, [] );

	return (
		<>
			<span ref={ marker } hidden />
			{ anchor && (
				<Popover
					anchor={ anchor }
					placement={ matchMedia( '(pointer: coarse)' ).matches ? 'bottom' : 'top' }
					focusOnMount={ false }
					className="jetpack-comments__format-tools"
				>
					<Toolbar label={ label } variant="unstyled">
						<BlockControls.Slot group="inline" />
					</Toolbar>
				</Popover>
			) }
		</>
	);
};

type WritingAreaProps = { undo: () => void; redo: () => void; children: ReactNode };

// Inside the provider, to put the caret at the end of the comment: where a reader expects
// to carry on after an undo or redo, which restores blocks but not the caret, and after a
// press on the empty space around the blocks, as in the textarea it replaced.
const WritingArea = ( { undo, redo, children }: WritingAreaProps ) => {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { getBlockOrder } = useSelect( blockEditorStore );

	const toEnd = useCallback( () => {
		// The innermost last block, where the text is: a list's last item, not the list.
		let last = getBlockOrder().at( -1 );
		while ( last && getBlockOrder( last ).length ) {
			last = getBlockOrder( last ).at( -1 );
		}

		if ( last ) {
			selectBlock( last, -1 );
		}
	}, [ getBlockOrder, selectBlock ] );

	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'z' ) {
				event.preventDefault();
				if ( event.shiftKey ) {
					redo();
				} else {
					undo();
				}
				requestAnimationFrame( toEnd );
			}
		},
		[ undo, redo, toEnd ]
	);

	// A click, a frame late: the editor syncs its selection from the page's as the press ends.
	const onClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			const target = event.target as Element;
			if ( target.closest( '.editor-styles-wrapper' ) && ! target.closest( '.wp-block' ) ) {
				requestAnimationFrame( toEnd );
			}
		},
		[ toEnd ]
	);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- listens for the editable text inside, which keyboards already reach.
		<div onKeyDownCapture={ onKeyDown } onClick={ onClick }>
			{ children }
		</div>
	);
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

	return (
		<SlotFillProvider>
			<BlockEditorProvider
				value={ blocks }
				onInput={ onEdit }
				onChange={ onEdit }
				settings={ settings }
				useSubRegistry
			>
				{ focus && <FocusOnMount /> }
				<WritingArea undo={ undo } redo={ redo }>
					<div className="jetpack-comments__toolbar">
						<BlockToolbar label={ labels.blockTools } />
					</div>
					<FormatToolbar label={ labels.formatTools } />
					{ /* In the page, not an iframe, so the blocks wear the theme's type. */ }
					<BlockTools>
						<WritingFlow className="editor-styles-wrapper">
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
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
