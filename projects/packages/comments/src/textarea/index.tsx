import { type TargetedEvent } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { loadEditor, matchTheme } from './load-editor';

import './style.scss';

/**
 * The comment textarea, which hands over to the block editor on first focus.
 * The textarea stays if the editor never arrives.
 *
 * @return The textarea and the editor's container.
 */
export const Textarea = () => {
	const { commentParent, commentValue, isBoxOpen } = useContext( CommentSignals );
	const { strings, maxLength, blocks, editor: labels } = JetpackComments;
	const textareaRef = useRef< HTMLTextAreaElement >( null );
	const editorRef = useRef< HTMLDivElement >( null );
	// Set by a click, so the editor's caret lands where it did; a keyboard arrival goes to the end.
	const clicked = useRef( false );
	const [ editor, setEditor ] = useState< 'none' | 'loading' | 'ready' | 'failed' >( 'none' );
	const prompt = commentParent.value ? strings.replyPlaceholder : strings.placeholder;
	const placeholder = `${ prompt }...`;
	const label = commentParent.value ? strings.replyLabel : strings.commentLabel;

	const openEditor = useCallback(
		( focus = true ) => {
			if ( ! blocks || editor !== 'none' ) {
				return;
			}

			const textarea = textareaRef.current!;
			matchTheme( textarea.closest< HTMLElement >( '.jetpack-comments__box' )!, textarea );
			setEditor( 'loading' );
			loadEditor()
				.then( ( { mountEditor } ) => {
					// First: a cached chunk renders the editor this microtask, and it can only focus once shown.
					setEditor( 'ready' );
					mountEditor( editorRef.current!, {
						initialContent: commentValue.peek(),
						labels,
						// Read once the editor renders, after the click has placed the textarea's caret.
						focus: focus ? () => ( clicked.current ? textarea.selectionStart : -1 ) : undefined,
						placeholder,
						onChange: content => ( commentValue.value = content ),
						onError: () => setEditor( 'failed' ),
					} );
				} )
				.catch( () => setEditor( 'failed' ) );
		},
		[ blocks, editor, placeholder, labels, commentValue ]
	);

	const onFocus = useCallback( () => {
		isBoxOpen.value = true;
		openEditor();
	}, [ isBoxOpen, openEditor ] );
	const markClicked = useCallback( () => ( clicked.current = true ), [] );
	const onEditorFocus = useCallback( () => ( isBoxOpen.value = true ), [ isBoxOpen ] );
	const onInput = useCallback(
		( event: TargetedEvent< HTMLTextAreaElement > ) =>
			( commentValue.value = event.currentTarget.value ),
		[ commentValue ]
	);

	// A draft saved from the editor is block markup, which the textarea would show raw.
	useEffect( () => {
		if ( commentValue.peek().includes( '<!-- wp:' ) ) {
			openEditor( false );
		}
	}, [] );

	// A draft from the editor is block markup, which only the editor shows.
	const text =
		editor !== 'ready' && commentValue.value.includes( '<!-- wp:' ) ? '' : commentValue.value;

	return (
		<>
			<textarea
				ref={ textareaRef }
				hidden={ editor === 'ready' }
				id="comment"
				name="comment"
				className="jetpack-comments__textarea"
				rows={ 2 }
				required
				maxLength={ maxLength }
				aria-label={ label }
				value={ text }
				// The draft restores it; the browser's own restore on reload would put back markup.
				autoComplete="off"
				// Held while the editor arrives, so nothing typed lands in a box about to go.
				readOnly={ editor === 'loading' }
				aria-busy={ editor === 'loading' }
				// Its loading copy, below, takes the placeholder's place.
				placeholder={ editor === 'loading' ? '' : placeholder }
				onPointerDown={ markClicked }
				onFocus={ onFocus }
				onInput={ onInput }
			/>
			{ editor === 'loading' && ! text && (
				<span className="jetpack-comments__loading" aria-hidden="true">
					{ prompt }
					<span>.</span>
					<span>.</span>
					<span>.</span>
				</span>
			) }
			{ editor !== 'none' && editor !== 'failed' && (
				<div
					ref={ editorRef }
					className="jetpack-comments__editor"
					// The textarea's name, which goes with it when the editor takes over.
					role="group"
					aria-label={ label }
					hidden={ editor !== 'ready' }
					onFocusCapture={ onEditorFocus }
				/>
			) }
		</>
	);
};
