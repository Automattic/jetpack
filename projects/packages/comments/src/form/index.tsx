import clsx from 'clsx';
import { render, type TargetedEvent } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { Identity, Options } from '../identity';
import { Dialog, DialogHost } from '../identity/dialog';
import { CommentSignals, createSignals } from '../shared/state';
import { markSubmitted, resolveSubmitted, saveDraft } from './draft';
import type { FormSettings } from '../shared/types';

import './style.scss';

const utf8 = new TextEncoder();

// Shared by every form on the page. A failure clears it, so the next reach tries again.
let editorModule: Promise< typeof import( '../editor' ) > | null = null;

const loadEditor = () => {
	// The chunk reads its translations as it loads.
	window.jetpackCommentsEditorLocale = JetpackComments.editorLocale;
	editorModule ??= import( /* webpackChunkName: "editor" */ '../editor' ).catch( error => {
		editorModule = null;
		throw error;
	} );

	return editorModule;
};

// Started when a reader reaches for the box, so it is often there by the time they click.
const preloadEditor = () => {
	loadEditor().catch( () => undefined );
};

const CommentForm = ( { form }: { form: HTMLFormElement } ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isPosting,
		commenter,
		rememberDetails,
		isFooterOpen,
		isOptionsOpen,
		isDialogOpen,
	} = useContext( CommentSignals );
	const { mustLogIn, identity, strings, avatarUrl, maxLength, blocks } = JetpackComments;
	const isSubmitting = useRef( false );
	const editorRef = useRef< HTMLDivElement >( null );
	// Downloaded on first focus; the textarea stays if it never arrives.
	const [ editor, setEditor ] = useState< 'none' | 'loading' | 'ready' | 'failed' >( 'none' );
	const prompt = commentParent.value ? strings.replyPlaceholder : strings.placeholder;
	const placeholder = `${ prompt }...`;

	const openEditor = useCallback(
		( focus = true ) => {
			if ( ! blocks || editor !== 'none' ) {
				return;
			}

			setEditor( 'loading' );
			loadEditor()
				.then( ( { mountEditor } ) => {
					mountEditor( editorRef.current!, {
						initialContent: commentValue.peek(),
						labels: { blockTools: strings.blockTools },
						focus,
						placeholder,
						onChange: content => ( commentValue.value = content ),
						onError: () => setEditor( 'failed' ),
					} );
					setEditor( 'ready' );
				} )
				.catch( () => setEditor( 'failed' ) );
		},
		[ blocks, editor, placeholder, strings, commentValue ]
	);

	const onFocus = useCallback( () => {
		isFooterOpen.value = true;
		openEditor();
	}, [ isFooterOpen, openEditor ] );
	const onEditorFocus = useCallback( () => ( isFooterOpen.value = true ), [ isFooterOpen ] );
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

	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			isFooterOpen.value = true;
		}
	}, [ isEmptyComment.value, isFooterOpen ] );

	// Clicks are read from pointerdown, not focusout: Safari fires focusout for a
	// button inside the form too, with no relatedTarget to tell the two apart.
	useEffect( () => {
		const close = () => {
			if ( isEmptyComment.peek() ) {
				isFooterOpen.value = false;
				isOptionsOpen.value = false;
			}
		};

		const onPointerDown = ( event: PointerEvent ) => {
			if ( ! form.contains( event.target as Node ) ) {
				close();
			}
		};

		const onFocusOut = ( event: FocusEvent ) => {
			if ( event.relatedTarget instanceof Node && ! form.contains( event.relatedTarget ) ) {
				close();
			}
		};

		document.addEventListener( 'pointerdown', onPointerDown );
		form.addEventListener( 'focusout', onFocusOut );

		return () => {
			document.removeEventListener( 'pointerdown', onPointerDown );
			form.removeEventListener( 'focusout', onFocusOut );
		};
	}, [ form, isEmptyComment, isFooterOpen, isOptionsOpen ] );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		const readParent = () => {
			commentParent.value = Number( parentInput.value ) || 0;
		};

		readParent();

		// A hidden input's `value` writes through to the attribute, so this sees
		// the assignment core's comment-reply.js makes.
		const observer = new MutationObserver( readParent );
		observer.observe( parentInput, { attributes: true, attributeFilter: [ 'value' ] } );

		return () => observer.disconnect();
	}, [ form, commentParent ] );

	useEffect( () => {
		const timer = setTimeout( () => saveDraft( formSettings.postId, commentValue.value ), 300 );

		return () => clearTimeout( timer );
	}, [ formSettings, commentValue.value ] );

	useEffect( () => {
		const onSubmit = ( event: SubmitEvent ) => {
			if ( commenter.peek().kind === 'unknown' && ! isDialogOpen.peek() ) {
				event.preventDefault();
				isDialogOpen.value = true;
				return;
			}

			if ( isSubmitting.current ) {
				return;
			}

			isSubmitting.current = true;
			isPosting.value = true;
			// Kept, not cleared: the server can still turn this away.
			saveDraft( formSettings.postId, commentValue.peek() );
			markSubmitted( formSettings.postId );
		};

		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				isSubmitting.current = false;
				isPosting.value = false;
			}
		};

		// Flushes the debounce above; safe for bfcache in a way beforeunload is not.
		const onPageHide = () => saveDraft( formSettings.postId, commentValue.peek() );

		form.addEventListener( 'submit', onSubmit );
		window.addEventListener( 'pageshow', onPageShow );
		window.addEventListener( 'pagehide', onPageHide );

		return () => {
			form.removeEventListener( 'submit', onSubmit );
			window.removeEventListener( 'pageshow', onPageShow );
			window.removeEventListener( 'pagehide', onPageHide );
		};
	}, [ form, formSettings, isPosting, commentValue, commenter, isDialogOpen ] );

	// Only where the site shows avatars; a commenter it does not know gets its default.
	const current = commenter.value;
	const avatar =
		avatarUrl &&
		( ( current.kind === 'wordpress' && current.avatar ) ||
			( current.kind === 'unknown' ? identity.defaultAvatar : avatarUrl ) );
	const { submit } = formSettings;
	// The textarea's maxLength holds back typing, not the editor. Counted as PHP counts, in UTF-8 bytes.
	const isTooLong = utf8.encode( commentValue.value ).length > maxLength;

	// A draft from the editor is block markup, which only the editor shows.
	const text =
		editor !== 'ready' && commentValue.value.includes( '<!-- wp:' ) ? '' : commentValue.value;

	return (
		<>
			<div
				className={ clsx( 'jetpack-comments__box', { 'is-open': isFooterOpen.value } ) }
				onPointerEnter={ blocks ? preloadEditor : undefined }
			>
				<textarea
					hidden={ editor === 'ready' }
					id="comment"
					name="comment"
					className="jetpack-comments__textarea"
					rows={ 2 }
					required
					maxLength={ maxLength }
					aria-label={ commentParent.value ? strings.replyLabel : strings.commentLabel }
					value={ text }
					// The draft restores it; the browser's own restore on reload would put back markup.
					autoComplete="off"
					// Held while the editor arrives, so nothing typed lands in a box about to go.
					readOnly={ editor === 'loading' }
					aria-busy={ editor === 'loading' }
					// Its loading copy, below, takes the placeholder's place.
					placeholder={ editor === 'loading' ? '' : placeholder }
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
						aria-label={ commentParent.value ? strings.replyLabel : strings.commentLabel }
						hidden={ editor !== 'ready' }
						onFocusCapture={ onEditorFocus }
					/>
				) }
				<div className={ clsx( 'jetpack-comments__footer', { 'is-open': isFooterOpen.value } ) }>
					<div className="jetpack-comments__actions">
						{ isTooLong && (
							<p className="jetpack-comments__too-long" role="alert">
								{ strings.tooLong }
							</p>
						) }
						<span className={ clsx( 'jetpack-comments__submit', submit.wrapClass ) }>
							<input
								id={ submit.id }
								name={ submit.name }
								type="submit"
								className={ submit.class }
								disabled={
									( mustLogIn && commenter.value.kind === 'unknown' && ! identity.canSignIn ) ||
									isEmptyComment.value ||
									isTooLong ||
									isPosting.value
								}
								value={ commentParent.value ? strings.reply : submit.label }
							/>
						</span>
						<span className="jetpack-comments__identity">
							{ avatar && (
								<img
									className="jetpack-comments__avatar avatar avatar-40 photo"
									src={ avatar }
									alt=""
									width="40"
									height="40"
								/>
							) }
							<Identity />
						</span>
					</div>
				</div>
			</div>
			<Options />
			{ /* Core clears saved details on any post without this. */ }
			{ commenter.value.kind === 'guest' && rememberDetails.value && (
				<input type="hidden" name="wp-comment-cookies-consent" value="yes" />
			) }
		</>
	);
};

// A page cache can pair settings from an older release with this bundle. The
// mount holds a plain form for that case, for a browser without form-associated
// custom elements, and for a script that never runs.
if (
	JetpackComments.version !== JETPACK_COMMENTS_VERSION ||
	! ( 'attachInternals' in HTMLElement.prototype )
) {
	document
		.querySelectorAll( '.jetpack-comments' )
		.forEach( element => element.classList.add( 'is-plain' ) );
} else {
	if ( ! customElements.get( 'jetpack-comments-dialog' ) ) {
		customElements.define( 'jetpack-comments-dialog', DialogHost );
	}

	document.querySelectorAll< HTMLElement >( '.jetpack-comments' ).forEach( element => {
		const form = element.closest( 'form' );

		if ( ! form ) {
			return;
		}

		let formSettings: FormSettings;

		try {
			// `||`: wp_json_encode() gives false on bad input, which arrives as an empty attribute.
			formSettings = JSON.parse( element.dataset.jetpackComments || '{}' ) as FormSettings;
		} catch {
			return;
		}

		// Before the signals read the draft, so a comment that landed is not offered back.
		resolveSubmitted( formSettings.postId );

		const signals = createSignals( formSettings );

		element.replaceChildren();
		element.classList.add( 'is-mounted' );
		render(
			<CommentSignals.Provider value={ signals }>
				<CommentForm form={ form } />
			</CommentSignals.Provider>,
			element
		);

		// Inside the form, so what it hands over posts with it. A page can hold two
		// comment forms, both with core's id, so nothing here may find the form by id.
		const host = form.appendChild(
			document.createElement( 'jetpack-comments-dialog' ) as DialogHost
		);
		render(
			<CommentSignals.Provider value={ signals }>
				<Dialog internals={ host.internals } />
			</CommentSignals.Provider>,
			host.attachShadow( { mode: 'open' } )
		);

		// The box wears the radius, inset, and type the theme gives its textarea, so the
		// block editor can match it; nothing exposes them otherwise.
		const textarea = element.querySelector( 'textarea' );
		if ( textarea ) {
			const { borderRadius, paddingInlineStart, fontFamily, fontSize, lineHeight } =
				getComputedStyle( textarea );
			element.style.setProperty( '--jetpack-comments-radius', borderRadius );
			element.style.setProperty( '--jetpack-comments-inset', paddingInlineStart );
			element.style.setProperty( '--jetpack-comments-font-family', fontFamily );
			element.style.setProperty( '--jetpack-comments-font-size', fontSize );
			element.style.setProperty( '--jetpack-comments-line-height', lineHeight );
		}

		// The theme's text colour and the page behind the box, for the editor's toolbar and
		// popovers; the background is the first ancestor that paints one.
		element.style.setProperty( '--jetpack-comments-color', getComputedStyle( element ).color );
		for ( let node = element.parentElement; node; node = node.parentElement ) {
			const { backgroundColor } = getComputedStyle( node );
			if ( backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent' ) {
				element.style.setProperty( '--jetpack-comments-background', backgroundColor );
				break;
			}
		}
	} );
}
