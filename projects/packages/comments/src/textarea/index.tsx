import { type TargetedEvent } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { logError } from '../shared/log-error';
import { CommentSignals } from '../shared/state';
import { recordEvent } from '../shared/tracks';
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
	const placeholder = commentParent.value ? strings.replyPlaceholder : strings.placeholder;
	// The loading copy animates its own dots, so it drops the translation's.
	const prompt = placeholder.replace( /\s*(?:\.{3}|…+)$/u, '' );
	const label = commentParent.value ? strings.replyLabel : strings.commentLabel;

	const openEditor = useCallback(
		( focus = true ) => {
			if ( ! blocks || editor !== 'none' ) {
				return;
			}

			const textarea = textareaRef.current!;
			const fail = ( stage: string, error: unknown ) => {
				setEditor( 'failed' );
				// Focus from script is never user activation; a restored draft means a reader.
				if ( focus && navigator.userActivation?.hasBeenActive === false ) {
					return;
				}
				recordEvent( 'jetpack_comments_editor_error', { stage } );
				logError( error, { stage } );
			};
			matchTheme( textarea.closest< HTMLElement >( '.jetpack-comments__box' )!, textarea );
			setEditor( 'loading' );
			loadEditor( JetpackComments.editorLocale )
				.then(
					( { mountEditor } ) => {
						mountEditor( editorRef.current!, {
							initialContent: commentValue.peek(),
							labels,
							// Read once the editor renders, after the click has placed the textarea's caret.
							focus: focus ? () => ( clicked.current ? textarea.selectionStart : -1 ) : undefined,
							placeholder,
							onChange: content => ( commentValue.value = content ),
							// Swapped here, not on the next render: the editor can only take focus once shown,
							// and an empty one shown early collapses the box for a frame.
							onReady: () => {
								editorRef.current!.hidden = false;
								textarea.hidden = true;
								setEditor( 'ready' );
							},
							onError: error => fail( 'render', error ),
						} );
					},
					error => fail( 'load', error )
				)
				// A throw while mounting, which the load handler above does not see.
				.catch( error => fail( 'render', error ) );
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

	// Core's Reply link focuses the form's first visible control, the toolbar once the editor hides
	// the textarea. Its handler runs before this one, which puts the caret at the end of the text.
	useEffect( () => {
		if ( editor !== 'ready' ) {
			return;
		}

		const onClick = ( event: MouseEvent ) => {
			const link = ( event.target as Element ).closest< HTMLElement >( '.comment-reply-link' );
			// Core prevents the link's navigation only when it moved the form, and a page can have several.
			const respond = link && document.getElementById( link.dataset.respondelement ?? '' );
			if ( ! event.defaultPrevented || ! respond?.contains( editorRef.current ) ) {
				return;
			}

			const editable = [
				...editorRef.current!.querySelectorAll< HTMLElement >(
					'.is-root-container [contenteditable="true"]'
				),
			].at( -1 );
			if ( ! editable ) {
				return;
			}

			editable.focus();
			// An empty block holds only its placeholder, which the caret goes before.
			const end = editable.querySelector( '[data-rich-text-placeholder]' )
				? 0
				: editable.childNodes.length;
			editable.ownerDocument.getSelection()?.collapse( editable, end );
		};

		document.addEventListener( 'click', onClick );

		return () => document.removeEventListener( 'click', onClick );
	}, [ editor ] );

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
					// The editor's prompt, which follows the box between comment and reply.
					style={ { '--jetpack-comments-placeholder': JSON.stringify( placeholder ) } }
					onFocusCapture={ onEditorFocus }
				/>
			) }
		</>
	);
};
