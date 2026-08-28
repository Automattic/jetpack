import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentingAs, Identity } from '../identity';
import { dropCode, heldCode, markCodeSpent, needsFreshCode } from '../identity/checkpoint/code';
import { connect } from '../identity/checkpoint/connect';
import { identityUser } from '../shared/identity';
import { CommentSignals, createSignals } from '../shared/state';
import { CommentField } from './comment-field';
import { markSubmitted, resolveSubmitted, saveDraft } from './draft';
import { SubmitButton } from './submit-button';
import type { FormSettings } from '../shared/types';

import './style.scss';

type CommentFormProps = {
	form: HTMLFormElement;
};

// Long enough to stop a synchronous write landing on every keystroke, short
// enough that a reader who navigates away mid-sentence keeps it.
const DRAFT_DEBOUNCE_MS = 300;

const CommentForm = ( { form }: CommentFormProps ) => {
	const { formSettings, commentParent, commentValue, isSavingComment } =
		useContext( CommentSignals );
	const isSubmitting = useRef( false );

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
		const onSubmit = ( event: Event ) => {
			if ( isSubmitting.current ) {
				return;
			}

			// A code that a submit already carried, or one about to lapse, would be
			// turned away. Replace it first, off this click so the popup is allowed;
			// WordPress.com's own cookie makes that instant. Then submit again.
			const held = heldCode.peek();
			if ( held && needsFreshCode( held ) ) {
				event.preventDefault();
				connect( held.provider ).then(
					() => form.requestSubmit(),
					() => {
						// Back to the guest form; the draft is still there.
						dropCode();
						identityUser.value = null;
					}
				);
				return;
			}

			isSubmitting.current = true;
			isSavingComment.value = true;
			// Kept, not cleared: the server can still turn this away.
			saveDraft( formSettings.postId, commentValue.peek() );
			markSubmitted( formSettings.postId );
			markCodeSpent();
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
	}, [ form, formSettings, isSavingComment, commentValue ] );

	return (
		<>
			<CommentField />
			<Identity />
			<div className="jetpack-comments__footer">
				<CommentingAs />
				<SubmitButton />
			</div>
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
