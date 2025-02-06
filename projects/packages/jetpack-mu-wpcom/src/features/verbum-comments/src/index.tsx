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
import {
	canWeAccessCookies,
	setUserInfoCookie,
	addWordPressDomain,
	hasSubscriptionOptionsVisible,
} from './utils';
import type { VerbumAppProps, VerbumComments } from './types';

import './style.scss';

const Verbum = ( { siteId, parentForm }: VerbumAppProps ) => {
	const {
		hasOpenedTrayOnce,
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

	const commentTextarea = useRef< HTMLTextAreaElement >();
	const [ email, setEmail ] = useState( '' );
	const [ ignoreSubscriptionModal, setIgnoreSubscriptionModal ] = useState( false );
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

	const handleSubscriptionModal = async event => {
		event.preventDefault();
		setShowMessage( '' );

		const formAction = parentForm.getAttribute( 'action' );
		const formData = new FormData( parentForm );

		// if formData email address is set, set the newUserEmail state
		if ( formData.get( 'email' ) ) {
			setEmail( formData.get( 'email' ) as string );
		}

		formData.set( 'verbum_show_subscription_modal', subscribeModalStatus.value );

		const response = await fetch( formAction, {
			method: 'POST',
			body: formData,
		} );

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

		// Show error message
		if ( errorMessageElement !== null ) {
			setShowMessage( errorMessageElement.innerHTML );
			setIsErrorMessage( true );
			isSavingComment.value = false;
		}

		// If no error message and not redirect, we re-submit the form as usual instead of using fetch.
		setIgnoreSubscriptionModal( true );
		isSavingComment.value = false;
		const submitFormFunction = Object.getPrototypeOf( parentForm ).submit;
		submitFormFunction.call( parentForm );
	};

	const handleCommentSubmit = async event => {
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

		setTimeout( () => ( isSavingComment.value = true ), 0 );

		if ( ! VerbumComments.isJetpackComments ) {
			if ( VerbumComments.enableSubscriptionModal && ! ignoreSubscriptionModal ) {
				isSavingComment.value = true;
				await handleSubscriptionModal( event );
			}
		}
	};

	const handleTrayToggle = () => {
		commentTextarea.current.focus();

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
					<LoggedIn siteId={ siteId } toggleTray={ handleTrayToggle } logout={ logout } />
				) : (
					<LoggedOut
						login={ login }
						canWeAccessCookies={ canWeAccessCookies() }
						loginWindow={ loginWindowRef }
					/>
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
