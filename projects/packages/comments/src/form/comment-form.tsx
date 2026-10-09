import clsx from 'clsx';
import { useContext, useEffect } from 'preact/hooks';
import { Footer } from '../footer';
import { markSubmitted, saveDraft } from '../shared/draft';
import { CommentSignals } from '../shared/state';
import { recordEvent } from '../shared/tracks';
import { Textarea } from '../textarea';
import { preloadEditor } from '../textarea/load-editor';

/**
 * The comment box, wired to the theme's form: its reply links, its submit, and the draft.
 *
 * @param props      - Component props.
 * @param props.form - The theme's comment form.
 * @return The box.
 */
export const CommentForm = ( { form }: { form: HTMLFormElement } ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isPosting,
		commenter,
		rememberDetails,
		isBoxOpen,
		isDialogOpen,
	} = useContext( CommentSignals );

	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			isBoxOpen.value = true;
		}
	}, [ isEmptyComment.value, isBoxOpen ] );

	// Clicks are read from pointerdown, not focusout: Safari fires focusout for a
	// button inside the form too, with no relatedTarget to tell the two apart.
	useEffect( () => {
		const close = () => {
			if ( isEmptyComment.peek() ) {
				isBoxOpen.value = false;
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
	}, [ form, isEmptyComment, isBoxOpen ] );

	// The top of the funnel: a reader who reached for the form, posting or not.
	useEffect( () => {
		const onFocusIn = () =>
			recordEvent( 'jetpack_comments_form_focus', {
				commenter: commenter.peek().kind,
				// Read from the input: a reply link focuses the box before the observer below hears of it.
				is_reply: Number( form.querySelector< HTMLInputElement >( '#comment_parent' )?.value ) > 0,
				editor: JetpackComments.blocks,
			} );

		form.addEventListener( 'focusin', onFocusIn, { once: true } );

		return () => form.removeEventListener( 'focusin', onFocusIn );
	}, [ form, commenter ] );

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

			// The busy button stays focusable, as core's does, so it is held here instead.
			if ( isPosting.peek() ) {
				event.preventDefault();
				return;
			}

			isPosting.value = true;
			// Kept, not cleared: the server can still turn this away.
			saveDraft( formSettings.postId, commentValue.peek() );
			markSubmitted( formSettings.postId );

			// Another script can cancel the submit after this runs, and the page then stays.
			setTimeout( () => {
				if ( event.defaultPrevented ) {
					isPosting.value = false;
				}
			} );
		};

		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
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

	return (
		<>
			<div
				className={ clsx( 'jetpack-comments__box', { 'is-open': isBoxOpen.value } ) }
				onPointerEnter={ JetpackComments.blocks ? preloadEditor : undefined }
			>
				<Textarea />
				<Footer />
			</div>
			{ /* Core clears saved details on any post without this. */ }
			{ commenter.value.kind === 'guest' && rememberDetails.value && (
				<input type="hidden" name="wp-comment-cookies-consent" value="yes" />
			) }
		</>
	);
};
