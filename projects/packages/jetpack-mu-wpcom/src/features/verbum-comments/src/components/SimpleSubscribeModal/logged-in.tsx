import { translate } from '../../i18n';
import { shouldShowSubscriptionModal } from '../../utils';
import useSubscriptionApi from '../../hooks/useSubscriptionApi';
import { SimpleSubscribeModalProps } from '../../types';
import SubscriptionModal from './subscription-modal';
import { subscriptionSettings, userInfo } from '../../state';

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
