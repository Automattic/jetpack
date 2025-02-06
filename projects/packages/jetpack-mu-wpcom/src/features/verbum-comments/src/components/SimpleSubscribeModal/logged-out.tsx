import { useContext, useEffect, useState } from 'preact/hooks';
import { translate } from '../../i18n';
import { VerbumSignals } from '../../state';
import { SimpleSubscribeModalProps } from '../../types';
import SubscriptionModal from './subscription-modal';
import type { ChangeEvent } from 'preact/compat';

// Subscription modal for logged-out users.
export const SimpleSubscribeModalLoggedOut = ( {
	subscribeState,
	setSubscribeState,
	closeModalHandler,
	email,
	setHasIframe,
}: SimpleSubscribeModalProps ) => {
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ iframeUrl, setIframeUrl ] = useState( '' );
	const [ subscribeDisabled, setSubscribeDisabled ] = useState( false );
	const { commentUrl } = useContext( VerbumSignals );

	// Only want this to run once, when email is set for the first time
	useEffect( () => {
		setUserEmail( email );
	}, [ email ] );

	const setSubscriptionEmail = ( event: ChangeEvent< HTMLInputElement > ) => {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		setUserEmail( event.currentTarget.value );
		if ( Boolean( emailRegex.test( event.currentTarget.value ) ) === false ) {
			setSubscribeDisabled( true );
			return;
		}
		setSubscribeDisabled( false );
	};

	/**
	 * Handle the iframe result.
	 * @param eventFromIframe - the event from the iframe
	 */
	function handleIframeResult( eventFromIframe: MessageEvent ) {
		if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
			const data = JSON.parse( eventFromIframe.data );
			if ( data && data.action === 'close' ) {
				window.removeEventListener( 'message', handleIframeResult );
				closeModalHandler();
				setHasIframe( false );
				setIframeUrl( '' );
			}
		}
	}

	/**
	 * Handle the subscribe button click.
	 */
	async function handleOnSubscribeClick() {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if ( Boolean( emailRegex.test( userEmail ) ) === false ) {
			return;
		}

		setSubscribeState( 'SUBSCRIBING' );
		setHasIframe( true );
		const subscribeData = {
			email: userEmail,
			post_id: VerbumComments.postId.toString(),
			plan: 'newsletter',
			blog: VerbumComments.siteId.toString(),
			source: 'jetpack_subscribe',
			display: 'alternate',
			app_source: 'verbum-subscription-modal',
			locale: VerbumComments.currentLocale ?? 'en',
		};
		const params = new URLSearchParams( subscribeData );

		setIframeUrl( 'https://subscribe.wordpress.com/memberships/?' + params.toString() );

		window.addEventListener( 'message', handleIframeResult, false );
	}

	if ( ! commentUrl.value ) {
		return;
	}

	if ( subscribeState === 'SUBSCRIBING' ) {
		return (
			<div className="verbum-simple-subscribe-modal__iframe-container">
				{ iframeUrl && (
					<iframe
						title={ translate( 'Never miss a beat!' ) }
						className="verbum-simple-subscribe-modal__iframe"
						frameBorder="0"
						src={ iframeUrl }
						id="VERBUM_subscribe_iframe"
					></iframe>
				) }
			</div>
		);
	}
	return (
		<SubscriptionModal
			userEmail={ userEmail }
			subscribeState={ subscribeState }
			handleOnSubscribeClick={ handleOnSubscribeClick }
			onInput={ setSubscriptionEmail }
			disabled={ false }
			subscribeDisabled={ subscribeDisabled }
			closeModalHandler={ closeModalHandler }
		/>
	);
};
