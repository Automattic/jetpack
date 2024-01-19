import { effect } from '@preact/signals';
import { render } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { SimpleSubscribeModal } from './components/SimpleSubscribeModal';
import { CommentFooter } from './components/comment-footer';
import { CommentInputField } from './components/comment-input-field';
import { CommentMessage } from './components/comment-message';
import { LoggedIn } from './components/logged-in';
import { LoggedOut } from './components/logged-out';
import useSocialLogin from './hooks/useSocialLogin';
import { translate } from './i18n';
import {
	hasOpenedTrayOnce,
	isEmptyComment,
	isSavingComment,
	isTrayOpen,
	mailLoginData,
	shouldStoreEmailData,
	userInfo,
	userLoggedIn,
} from './state';
import {
	classNames,
	canWeAccessCookies,
	setUserInfoCookie,
	addWordPressDomain,
	hasSubscriptionOptionsVisible,
} from './utils';
import type { VerbumComments } from './types';

import './style.scss';

const Verbum = ( { siteId }: VerbumComments ) => {
	const [ showMessage, setShowMessage ] = useState( '' );
	const [ isErrorMessage, setIsErrorMessage ] = useState( false );
	const [ subscribeModalStatus, setSubscribeModalStatus ] = useState<
		| 'showed'
		| 'hidden_cookies_disabled'
		| 'hidden_subscribe_not_enabled'
		| 'hidden_views_limit'
		| 'hidden_already_subscribed'
	>();
	const [ commentUrl, setCommentUrl ] = useState( '' );

	const commentTextarea = useRef< HTMLTextAreaElement >();
	const [ email, setEmail ] = useState( '' );
	const [ ignoreSubscriptionModal, setIgnoreSubscriptionModal ] = useState( false );
	const { login, loginWindowRef, logout } = useSocialLogin();

	effect( () => {
		// The tray, when there is no sub options, is pretty minimal.
		// It's also needed to log out. Without this, the user will have to type to reveal the tray and they won't guess they need to type to logout.
		if ( ! hasSubscriptionOptionsVisible() && userLoggedIn.value ) {
			isTrayOpen.value = true;
		}
	} );

	const subscriptionTraySeen = () => {
		try {
			return window.localStorage.getItem(
				`${ userInfo.value?.uid }-verbum-settings-open-${ siteId }`
			);
		} catch ( e ) {
			return false;
		}
	};

	const setSubscriptionTraySeen = () => {
		try {
			localStorage.setItem( `${ userInfo.value?.uid }-verbum-settings-open-${ siteId }`, '1' );
			hasOpenedTrayOnce.value = true;
		} catch ( e ) {
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

		const formAction = document.querySelector( '#commentform' ).getAttribute( 'action' );

		const formElement = document.querySelector( '#commentform' ) as HTMLFormElement;

		const formData = new FormData( formElement );

		// if formData email address is set, set the newUserEmail state
		if ( formData.get( 'email' ) ) {
			setEmail( formData.get( 'email' ) as string );
		}

		// We get the parent comment id to scroll on page reload.
		// If the user is not replying any comment, we scroll to the comment form.
		const parentCommentId = Number( formData.get( 'comment_parent' ) );

		formData.set( 'verbum_show_subscription_modal', subscribeModalStatus );

		const response = await fetch( formAction, {
			method: 'POST',
			body: formData,
		} );

		if ( response.redirected ) {
			setCommentUrl(
				response.url + ( parentCommentId > 0 ? '#comment-' + parentCommentId : '#respond' )
			);
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
		const submitFormFunction = Object.getPrototypeOf( formElement ).submit;
		submitFormFunction.call( formElement );
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
		const destinationUrl = new URL( commentUrl );

		// current URL without hash
		const currentUrlWithoutHash = location.href.replace( location.hash, '' );
		// destination URL without hash
		const destinationUrlWithoutHash = destinationUrl.href.replace( destinationUrl.hash, '' );
		window.location.href = commentUrl;

		// reload the page if the user is already on the comment page
		if ( currentUrlWithoutHash === destinationUrlWithoutHash ) {
			window.location.reload();
		}
	};

	const handleBeforeUnload = useCallback( ( event: BeforeUnloadEvent ) => {
		event.preventDefault();
		event.returnValue = '';
	}, [] );

	useEffect( () => {
		if ( ! isEmptyComment.value ) {
			window.addEventListener( 'beforeunload', handleBeforeUnload );
			return () => {
				window.removeEventListener( 'beforeunload', handleBeforeUnload );
			};
		}
	}, [ isEmptyComment.value ] );

	return (
		<>
			<CommentInputField ref={ commentTextarea } handleOnKeyUp={ showTrayIfNewUser } />
			<div
				className={ classNames( 'comment-form__subscription-options', {
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
			<CommentFooter toggleTray={ handleTrayToggle } handleOnSubmitClick={ handleCommentSubmit } />
			<CommentMessage message={ showMessage } isError={ isErrorMessage } />
			{ VerbumComments.enableSubscriptionModal && (
				<SimpleSubscribeModal
					commentUrl={ commentUrl }
					setSubscribeModalStatus={ setSubscribeModalStatus }
					subscribeModalStatus={ subscribeModalStatus }
					closeModalHandler={ closeModalHandler }
					email={ email }
				/>
			) }
		</>
	);
};

const { siteId } = {
	...VerbumComments,
};

render( <Verbum siteId={ siteId } />, document.getElementById( 'comment-form__verbum' ) );
