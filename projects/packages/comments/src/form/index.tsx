import clsx from 'clsx';
import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentingAs, Identity } from '../identity';
import { CommentSignals, createSignals } from '../shared/state';
import { hasSubscriptionOptions } from '../subscriptions';
import { CommentField } from './comment-field';
import { markSubmitted, resolveSubmitted, saveDraft } from './draft';
import { SubmitButton } from './submit-button';
import type { FormSettings } from '../shared/types';

import './style.scss';

type CommentFormProps = {
	form: HTMLFormElement;
};

// Short enough that a reader who navigates away mid-sentence keeps the draft.
const DRAFT_DEBOUNCE_MS = 300;

const CommentForm = ( { form }: CommentFormProps ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isSavingComment,
		isTrayOpen,
		isSignedIn,
		signedIn,
	} = useContext( CommentSignals );
	const isSubmitting = useRef( false );

	useEffect( () => {
		if ( isSignedIn.value && ! hasSubscriptionOptions() ) {
			isTrayOpen.value = true;
		}
	}, [ isSignedIn.value, isTrayOpen ] );

	// On the empty-to-not transition only, so closing the tray mid-sentence sticks.
	useEffect( () => {
		const isReturning = isSignedIn.value && ! signedIn.value?.code;

		if ( ! isEmptyComment.value && ! isReturning ) {
			isTrayOpen.value = true;
		}
	}, [ isEmptyComment.value, isSignedIn, signedIn, isTrayOpen ] );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		const readParent = () => {
			commentParent.value = Number( parentInput.value ) || 0;
		};

		readParent();

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
		const onSubmit = () => {
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

		// pagehide rather than beforeunload, which would keep the page out of bfcache.
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
			<div
				id={ `jetpack-comments-tray-${ formSettings.postId }` }
				className={ clsx( 'jetpack-comments__tray', { 'is-open': isTrayOpen.value } ) }
			>
				<div>
					<Identity />
				</div>
			</div>
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
		// `||`, not `??`: a wp_json_encode() failure lands here as an empty string.
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
