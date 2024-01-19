import useSubscriptionApi from '../../hooks/useSubscriptionApi';
import { translate } from '../../i18n';
import { subscriptionSettings, userInfo } from '../../state';
import { SimpleSubscribeModalProps } from '../../types';
import { shouldShowSubscriptionModal } from '../../utils';
import SubscriptionModal from './subscription-modal';

// This determines if the modal should be shown to the user.
// It's called before the modal is rendered.
export const SimpleSubscribeSetModalShowLoggedIn = ( {
	setSubscribeModalStatus,
}: {
	setSubscribeModalStatus: ( value: boolean ) => void;
} ) => {
	const { email } = subscriptionSettings.value ?? {
		email: {
			send_posts: false,
		},
	};
	setSubscribeModalStatus( shouldShowSubscriptionModal( email?.send_posts, userInfo.value?.uid ) );

	return null;
};

// Subscription modal for logged in users.
export const SimpleSubscribeModalLoggedIn = ( {
	commentUrl,
	subscribeState,
	setSubscribeState,
}: SimpleSubscribeModalProps ) => {
	const { setEmailPostsSubscription } = useSubscriptionApi();

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

	if ( ! commentUrl ) {
		return;
	}

	return (
		<>
			{ subscribeState === 'SUBSCRIBED' ? (
				<h2>{ translate( "We'll keep you in the loop!" ) }</h2>
			) : (
				<SubscriptionModal
					userEmail={ userInfo.value?.email }
					subscribeState={ subscribeState }
					handleOnSubscribeClick={ handleOnSubscribeClick }
					disabled={ true }
				/>
			) }
		</>
	);
};
