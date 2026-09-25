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

type CommentFormProps = {
	form: HTMLFormElement;
};

// Long enough to stop a synchronous write landing on every keystroke, short
// enough that a reader who navigates away mid-sentence keeps it.
const DRAFT_DEBOUNCE_MS = 300;

const CommentForm = ( { form }: CommentFormProps ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isSavingComment,
		signedIn,
		isOpen,
		isModalOpen,
		isSavedGuest,
	} = useContext( CommentSignals );
	const { isLoggedIn, mustLogIn, identity, strings } = JetpackComments;
	const isSubmitting = useRef( false );

	// Opens as the comment goes from empty to not, so a draft brought back opens it too.
	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			isOpen.value = true;
		}
	}, [ isEmptyComment.value, isOpen ] );

	// Folds away on a click or a Tab that leaves the form with nothing typed.
	// Clicks are read from pointerdown, not focusout: Safari fires focusout for a
	// button inside the form too, with no relatedTarget to tell the two apart.
	useEffect( () => {
		const close = () => {
			if ( isEmptyComment.peek() ) {
				isOpen.value = false;
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
	}, [ form, isEmptyComment, isOpen ] );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		const readParent = () => {
			commentParent.value = Number( parentInput.value ) || 0;
		};

		readParent();

		// #comment_parent is a hidden input, whose `value` IDL attribute writes
		// straight through to the content attribute, so the assignment core's
		// comment-reply.js makes is one this sees.
		const observer = new MutationObserver( readParent );
		observer.observe( parentInput, { attributes: true, attributeFilter: [ 'value' ] } );

		return () => observer.disconnect();
	}, [ form, commentParent ] );

	useEffect( () => {
		const timer = setTimeout(
			() => saveDraft( formSettings.postId, commentValue.value ),
			DRAFT_DEBOUNCE_MS
		);

		return () => clearTimeout( timer );
	}, [ formSettings, commentValue.value ] );

	useEffect( () => {
		const onSubmit = ( event: SubmitEvent ) => {
			// A reader the site does not know is asked who they are first; the dialog's own buttons submit again.
			const isKnown = isLoggedIn || signedIn.peek() || isSavedGuest;

			if ( ! isKnown && ! isModalOpen.peek() ) {
				event.preventDefault();
				isModalOpen.value = true;
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

		// Flush whatever the debounce above is still holding. Safe for bfcache in
		// a way beforeunload is not.
		const onPageHide = () => saveDraft( formSettings.postId, commentValue.peek() );

		form.addEventListener( 'submit', onSubmit );
		window.addEventListener( 'pageshow', onPageShow );
		window.addEventListener( 'pagehide', onPageHide );

		return () => {
			form.removeEventListener( 'submit', onSubmit );
			window.removeEventListener( 'pageshow', onPageShow );
			window.removeEventListener( 'pagehide', onPageHide );
		};
	}, [ form, formSettings, isSavingComment, commentValue, signedIn, isModalOpen, isSavedGuest ] );

	const avatar = signedIn.value?.avatar || JetpackComments.avatarUrl;

	// Only where there is no way to log in: with the popup, the dialog asks instead.
	const isSubmitDisabled =
		( mustLogIn && ! signedIn.value && ! identity.canSignIn ) ||
		isEmptyComment.value ||
		isSavingComment.value;

	return (
		<>
			{ avatar && (
				<div className={ clsx( 'jetpack-comments__avatar', JetpackComments.avatarWrapClass ) }>
					<img
						className="avatar avatar-40 photo wp-block-avatar__image"
						src={ avatar }
						alt=""
						width="40"
						height="40"
					/>
				</div>
			) }
			<div className="jetpack-comments__body">
				<CommentField />
				<div className={ clsx( 'jetpack-comments__tray', { 'is-open': isOpen.value } ) }>
					<div className="jetpack-comments__actions">
						<Identity />
						<span className={ clsx( 'jetpack-comments__submit', formSettings.submitWrapClass ) }>
							<input
								id={ formSettings.submitId }
								name={ formSettings.submitName }
								type="submit"
								className={ clsx( formSettings.submitClass, { 'is-busy': isSavingComment.value } ) }
								disabled={ isSubmitDisabled }
								value={ commentParent.value ? strings.reply : formSettings.submitLabel }
							/>
						</span>
					</div>
				</div>
			</div>
			{ /* Consent was given when the details were saved; without it core would clear them on this post. */ }
			{ isSavedGuest && ! signedIn.value && (
				<input type="hidden" name="wp-comment-cookies-consent" value="yes" />
			) }
			<IdentityDialog />
		</>
	);
};

document.querySelectorAll< HTMLElement >( '.jetpack-comments' ).forEach( element => {
	const form = element.closest( 'form' );

	if ( ! form ) {
		return;
	}

	let formSettings: FormSettings;

	try {
		// `||` rather than `??`: wp_json_encode() returns false on bad input, which
		// reaches the attribute as an empty string that JSON.parse() would throw on.
		formSettings = JSON.parse( element.dataset.jetpackComments || '{}' ) as FormSettings;
	} catch {
		return;
	}

	// Before the signals read the draft, so a comment that landed is not offered back.
	resolveSubmitted( formSettings.postId );

	render(
		<CommentSignals.Provider value={ createSignals( formSettings ) }>
			<CommentForm form={ form } />
		</CommentSignals.Provider>,
		element
	);
} );
