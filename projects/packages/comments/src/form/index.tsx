import clsx from 'clsx';
import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { Identity } from '../identity';
import { IdentityDialog } from '../identity/dialog';
import { CommentSignals, createSignals } from '../shared/state';
import { CommentField } from './comment-field';
import { markSubmitted, resolveSubmitted, saveDraft } from './draft';
import type { FormSettings } from '../shared/types';

import './style.scss';

const CommentForm = ( { form }: { form: HTMLFormElement } ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isSavingComment,
		signedIn,
		isSavedGuest,
		isKnown,
		isTrayOpen,
		isDialogOpen,
	} = useContext( CommentSignals );
	const { mustLogIn, identity, strings, avatarUrl } = JetpackComments;
	const isSubmitting = useRef( false );

	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			isTrayOpen.value = true;
		}
	}, [ isEmptyComment.value, isTrayOpen ] );

	// Clicks are read from pointerdown, not focusout: Safari fires focusout for a
	// button inside the form too, with no relatedTarget to tell the two apart.
	useEffect( () => {
		const close = () => {
			if ( isEmptyComment.peek() ) {
				isTrayOpen.value = false;
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
	}, [ form, isEmptyComment, isTrayOpen ] );

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
			if ( ! isKnown.peek() && ! isDialogOpen.peek() ) {
				event.preventDefault();
				isDialogOpen.value = true;
				return;
			}

			if ( isSubmitting.current ) {
				return;
			}

			isSubmitting.current = true;
			isSavingComment.value = true;
			// Kept, not cleared: the server can still turn this away.
			saveDraft( formSettings.postId, commentValue.peek() );
			markSubmitted( formSettings.postId );
		};

		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				isSubmitting.current = false;
				isSavingComment.value = false;
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
	}, [ form, formSettings, isSavingComment, commentValue, isKnown, isDialogOpen ] );

	// Empty when the site shows no avatars, which a popup sign-in's does not override.
	const avatar = avatarUrl && ( signedIn.value?.avatar || avatarUrl );
	const { submit } = formSettings;

	return (
		<>
			{ avatar && (
				<img
					className="jetpack-comments__avatar avatar avatar-40 photo"
					src={ avatar }
					alt=""
					width="40"
					height="40"
				/>
			) }
			<div className="jetpack-comments__body">
				<CommentField />
				<div className={ clsx( 'jetpack-comments__tray', { 'is-open': isTrayOpen.value } ) }>
					<div className="jetpack-comments__actions">
						<span className={ clsx( 'jetpack-comments__submit', submit.wrapClass ) }>
							<input
								id={ submit.id }
								name={ submit.name }
								type="submit"
								className={ submit.class }
								disabled={
									( mustLogIn && ! signedIn.value && ! identity.canSignIn ) ||
									isEmptyComment.value ||
									isSavingComment.value
								}
								value={ commentParent.value ? strings.reply : submit.label }
							/>
						</span>
						<Identity />
					</div>
				</div>
			</div>
			{ /* Core clears saved details on any post without this. */ }
			{ isSavedGuest && ! signedIn.value && (
				<input type="hidden" name="wp-comment-cookies-consent" value="yes" />
			) }
			<IdentityDialog />
		</>
	);
};

// A page cache can pair settings from an older release with this bundle. The
// mount holds a plain form for that case, and for a script that never runs.
if ( JetpackComments.version === JETPACK_COMMENTS_VERSION ) {
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

		element.replaceChildren();
		element.classList.add( 'is-mounted' );
		render(
			<CommentSignals.Provider value={ createSignals( formSettings ) }>
				<CommentForm form={ form } />
			</CommentSignals.Provider>,
			element
		);
	} );
}
