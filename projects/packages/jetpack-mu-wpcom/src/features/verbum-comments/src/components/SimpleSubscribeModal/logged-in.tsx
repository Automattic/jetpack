import { useContext } from 'preact/hooks';
import useSubscriptionApi from '../../hooks/useSubscriptionApi';
import { translate } from '../../i18n';
import { VerbumSignals } from '../../state';
import { SimpleSubscribeModalProps } from '../../types';
import { shouldShowSubscriptionModal } from '../../utils';
import SubscriptionModal from './subscription-modal';

// This determines if the modal should be shown to the user.
// It's called before the modal is rendered.
export const SimpleSubscribeSetModalShowLoggedIn = () => {
	const { subscriptionSettings, userInfo, subscribeModalStatus } = useContext( VerbumSignals );
	const { email } = subscriptionSettings.value ?? {
		email: {
			send_posts: false,
		},
	};
	subscribeModalStatus.value = shouldShowSubscriptionModal(
		email?.send_posts,
		userInfo.value?.uid
	);
	return null;
};

// Subscription modal for logged in users.
export const SimpleSubscribeModalLoggedIn = ( {
	subscribeState,
	setSubscribeState,
	closeModalHandler,
}: SimpleSubscribeModalProps ) => {
	const { setEmailPostsSubscription } = useSubscriptionApi();
	const { userInfo, commentUrl } = useContext( VerbumSignals );

	/**
	 * Handle the subscribe button click.
	 */
	async function handleOnSubscribeClick() {
		setSubscribeState( 'SUBSCRIBING' );
		await setEmailPostsSubscription( {
			type: 'subscribe',
			value: true,
			trackSource: 'verbum-subscription-modal',
		} );
		setSubscribeState( 'SUBSCRIBED' );
	}

	if ( ! commentUrl.value ) {
		return;
	}

	return (
		<>
			{ subscribeState === 'SUBSCRIBED' ? (
				<>
					<h2>{ translate( "We'll keep you in the loop!" ) }</h2>
					<div className="verbum-simple-subscribe-modal__close-button-container">
						<button
							onClick={ closeModalHandler }
							className="verbum-simple-subscribe-modal__close-button"
						>
							{ translate( 'Continue reading' ) }
						</button>
					</div>
				</>
			) : (
				<SubscriptionModal
					userEmail={ userInfo.value?.email }
					subscribeState={ subscribeState }
					handleOnSubscribeClick={ handleOnSubscribeClick }
					closeModalHandler={ closeModalHandler }
					disabled={ true }
				/>
			) }
		</>
	);
};
