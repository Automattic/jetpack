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

// Long enough to stop a synchronous write landing on every keystroke, short
// enough that a reader who navigates away mid-sentence keeps it.
const DRAFT_DEBOUNCE_MS = 300;

// Remembers, per site, that a signed-in reader has had the tray opened for them once.
const traySeenKey = ( blogId: number ) => `jetpack-comments-tray-seen-${ blogId }`;

const traySeen = ( blogId: number ) => {
	try {
		return window.localStorage.getItem( traySeenKey( blogId ) ) !== null;
	} catch {
		return true;
	}
};

const markTraySeen = ( blogId: number ) => {
	try {
		window.localStorage.setItem( traySeenKey( blogId ), '1' );
	} catch {
		// Then it opens again next time, which is no worse than Verbum did.
	}
};

const CommentForm = ( { form }: CommentFormProps ) => {
	const {
		formSettings,
		commentParent,
		commentValue,
		isEmptyComment,
		isSavingComment,
		isTrayOpen,
		isSignedIn,
	} = useContext( CommentSignals );
	const isSubmitting = useRef( false );
	const { blogId } = JetpackComments.identity;

	// A signed-in reader with nothing to set gets the tray held open: the way out lives in it.
	useEffect( () => {
		if ( isSignedIn.value && ! hasSubscriptionOptions() ) {
			isTrayOpen.value = true;
		}
	}, [ isSignedIn.value, isTrayOpen ] );

	// Opens only as the comment goes from empty to not, so closing the tray mid-sentence
	// sticks. Every time for a guest, who has to see the fields; once per site when
	// signed in, so the options are noticed without being in the way after that.
	useEffect( () => {
		if ( isEmptyComment.value ) {
			return;
		}

		if ( ! isSignedIn.value ) {
			isTrayOpen.value = true;
		} else if ( ! traySeen( blogId ) ) {
			isTrayOpen.value = true;
			markTraySeen( blogId );
		}
	}, [ isEmptyComment.value, isSignedIn.value, isTrayOpen, blogId ] );

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
