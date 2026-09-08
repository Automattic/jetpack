import { effect } from '@preact/signals';
import clsx from 'clsx';
import { render } from 'preact';
import { useState, useEffect, useRef, useCallback, useContext } from 'preact/hooks';
import { SimpleSubscribeModal } from './components/SimpleSubscribeModal';
import { CommentFooter } from './components/comment-footer';
import { CommentInputField } from './components/comment-input-field';
import { CommentMessage } from './components/comment-message';
import { LoggedIn } from './components/logged-in';
import { LoggedOut } from './components/logged-out';
import useFormMutations from './hooks/useFormMutations';
import useSocialLogin from './hooks/useSocialLogin';
import { translate } from './i18n';
import { createSignals, VerbumSignals } from './state';
import { setUserInfoCookie, addWordPressDomain, hasSubscriptionOptionsVisible } from './utils';
import type { VerbumAppProps } from './types';

import './style.scss';

const Verbum = ( { siteId, parentForm }: VerbumAppProps ) => {
	const {
		hasOpenedTrayOnce,
		isCommentBlocked,
		isEmptyComment,
		isSavingComment,
		isTrayOpen,
		mailLoginData,
		shouldStoreEmailData,
		userInfo,
		userLoggedIn,
		commentUrl,
		commentParent,
		subscribeModalStatus,
	} = useContext( VerbumSignals );

	const [ showMessage, setShowMessage ] = useState( '' );
	const [ isErrorMessage, setIsErrorMessage ] = useState( false );

	const commentTextarea = useRef< HTMLTextAreaElement >( null );
	const [ email, setEmail ] = useState( '' );
	// A ref, not a signal: it has to take effect inside the submit handler itself, before
	// Preact gets a chance to re-render the button as disabled.
	const isSubmitting = useRef( false );
	const { login, loginWindowRef, logout } = useSocialLogin();

	useFormMutations( parentForm );

	const dispose = effect( () => {
		// The tray, when there is no sub options, is pretty minimal.
		// It's also needed to log out. Without this, the user will have to type to reveal the tray and they won't guess they need to type to logout.
		if ( ! hasSubscriptionOptionsVisible() && userLoggedIn.value ) {
			isTrayOpen.value = true;
		}
	} );

	const handleBeforeUnload = useCallback( ( event: BeforeUnloadEvent ) => {
		event.preventDefault();
		event.returnValue = '';
	}, [] );

	useEffect( () => {
		if ( parentForm ) {
			parentForm.addEventListener( 'submit', handleCommentSubmit );
			return () => {
				parentForm.removeEventListener( 'submit', handleCommentSubmit );
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ parentForm ] );

	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			window.addEventListener( 'beforeunload', handleBeforeUnload );
			return () => {
				dispose();
				window.removeEventListener( 'beforeunload', handleBeforeUnload );
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isEmptyComment.value ] );

	useEffect( () => {
		// The back/forward cache restores this page with the in-flight submission still recorded,
		// which would leave the form locked for good once the commenter navigates back to it.
		const handlePageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				isSubmitting.current = false;
				isSavingComment.value = false;
			}
		};

		window.addEventListener( 'pageshow', handlePageShow );
		return () => {
			window.removeEventListener( 'pageshow', handlePageShow );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const subscriptionTraySeen = () => {
		try {
			return window.localStorage.getItem(
				`${ userInfo.value?.uid }-verbum-settings-open-${ siteId }`
			);
		} catch {
			return false;
		}
	};

	const setSubscriptionTraySeen = () => {
		try {
			localStorage.setItem( `${ userInfo.value?.uid }-verbum-settings-open-${ siteId }`, '1' );
			hasOpenedTrayOnce.value = true;
		} catch {
			// Do nothing.
		}
	};

	const showTrayIfNewUser = () => {
		if ( ! userLoggedIn.value ) {
			isTrayOpen.value = true;
			return;
		}
		// I check the localStorage, to see if they have submitted a comment before on this site.
		if ( ! subscriptionTraySeen && ! hasOpenedTrayOnce.value ) {
			// If they have not, we open the tray for them. Once.
			isTrayOpen.value = true;
			hasOpenedTrayOnce.value = true;
		}
	};

	// Only call this when the comment was rejected. Releasing it after a comment was accepted
	// hands the commenter a live button for something the server already stored.
	const allowResubmission = ( message: string ) => {
		setShowMessage( message );
		setIsErrorMessage( true );
		isSavingComment.value = false;
		isSubmitting.current = false;
	};

	const handleSubscriptionModal = async ( event: Event ) => {
		event.preventDefault();
		setShowMessage( '' );

		const formAction = parentForm.getAttribute( 'action' );
		const formData = new FormData( parentForm );

		// if formData email address is set, set the newUserEmail state
		if ( formData.get( 'email' ) ) {
			setEmail( formData.get( 'email' ) as string );
		}

		formData.set( 'verbum_show_subscription_modal', subscribeModalStatus.value ?? '' );

		let response: Response;

		try {
			response = await fetch( formAction!, {
				method: 'POST',
				body: formData,
			} );
		} catch {
			// The request never completed, so nothing was stored and retrying is safe.
			allowResubmission( translate( 'Your comment could not be sent. Please try again.' ) );
			return;
		}

		if ( response.redirected ) {
			// If the user is not replying any comment, we scroll to the comment form.
			commentUrl.value =
				response.url + ( commentParent.value > 0 ? '#comment-' + commentParent.value : '#respond' );
			setShowMessage( translate( 'Comment sent successfully' ) );
			setIsErrorMessage( false );
			return;
		}

		const text = await response.text();
		const doc = new DOMParser().parseFromString( text, 'text/html' );
		const errorMessageElement = doc.querySelector( '.wp-die-message p' );

		// wp-comments-post.php answered without redirecting, which it only does when it rejected
		// the comment. Report why and let the commenter decide to try again -- re-posting the form
		// from here is what turned a single click into several identical comments.
		allowResubmission(
			errorMessageElement?.innerHTML ??
				translate( 'Your comment could not be sent. Please try again.' )
		);
	};

	const handleCommentSubmit = async ( event: Event ) => {
		if ( isCommentBlocked.value ) {
			event.preventDefault();
			return;
		}

		// Stop every re-entry path -- repeated clicks, implicit submission from the name and email
		// fields, another script calling submit() -- before a second request can leave the browser.
		if ( isSubmitting.current ) {
			event.preventDefault();
			event.stopImmediatePropagation();
			return;
		}

		isSubmitting.current = true;
		isSavingComment.value = true;

		window.removeEventListener( 'beforeunload', handleBeforeUnload );
		if ( userInfo.value?.service === 'guest' ) {
			if ( shouldStoreEmailData.value ) {
				const mailLoginDataValue = mailLoginData.value;
				setUserInfoCookie( {
					service: 'guest',
					...( mailLoginDataValue?.email && { email: mailLoginDataValue?.email } ),
					...( mailLoginDataValue?.author && { author: mailLoginDataValue?.author } ),
					...( mailLoginDataValue?.url && { url: mailLoginDataValue?.url } ),
				} );
			} else {
				// Clear mail form cookie data
				document.cookie = `wpc_guest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure=True;${ addWordPressDomain }`;
			}
		}

		if ( ! subscriptionTraySeen && userLoggedIn.value ) {
			setSubscriptionTraySeen();
		}

		if ( ! VerbumComments.isJetpackComments && VerbumComments.enableSubscriptionModal ) {
			await handleSubscriptionModal( event );
		}
	};

	const handleTrayToggle = () => {
		commentTextarea.current?.focus();

		if ( isTrayOpen.value && ! subscriptionTraySeen && userLoggedIn.value ) {
			setSubscriptionTraySeen();
		}

		isTrayOpen.value = ! isTrayOpen.value;
	};

	const closeModalHandler = () => {
		const destinationUrl = new URL( commentUrl.value );

		// current URL without hash
		const currentUrlWithoutHash = location.href.replace( location.hash, '' );
		// destination URL without hash
		const destinationUrlWithoutHash = destinationUrl.href.replace( destinationUrl.hash, '' );
		window.location.href = commentUrl.value;

		// reload the page if the user is already on the comment page
		if ( currentUrlWithoutHash === destinationUrlWithoutHash ) {
			window.location.reload();
		}
	};

	return (
		<>
			<CommentInputField ref={ commentTextarea } handleOnKeyUp={ showTrayIfNewUser } />
			<div
				className={ clsx( 'comment-form__subscription-options', {
					open: isTrayOpen.value,
				} ) }
			>
				{ userLoggedIn.value ? (
					<LoggedIn siteId={ siteId } toggleTray={ handleTrayToggle } logout={ logout! } />
				) : (
					<LoggedOut login={ login! } loginWindow={ loginWindowRef ?? null } />
				) }
			</div>
			<CommentFooter toggleTray={ handleTrayToggle } />
			<CommentMessage message={ showMessage } isError={ isErrorMessage } />
			{ VerbumComments.enableSubscriptionModal && (
				<SimpleSubscribeModal closeModalHandler={ closeModalHandler } email={ email } />
			) }
		</>
	);
};

const { siteId } = {
	...VerbumComments,
};

document.querySelectorAll( '.comment-form__verbum' ).forEach( element => {
	render(
		<VerbumSignals.Provider value={ createSignals() }>
			<Verbum siteId={ siteId } parentForm={ element.parentNode as HTMLFormElement } />
		</VerbumSignals.Provider>,
		element
	);
} );
