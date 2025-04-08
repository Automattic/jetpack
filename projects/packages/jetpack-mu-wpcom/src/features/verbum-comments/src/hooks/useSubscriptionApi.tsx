import { useState, useEffect, useContext } from 'preact/hooks';
import wpcomRequest from 'wpcom-proxy-request';
import { VerbumSignals } from '../state';
import { SubscriptionDetails, EmailPostsChange, EmailSubscriptionResponse } from '../types';

const getSubscriptionDetails = async () => {
	const { siteId } = VerbumComments;

	if ( ! siteId ) {
		return false;
	}

	return await wpcomRequest( {
		path: `/read/sites/${ siteId }/subscription-details?post_id=${ encodeURIComponent(
			VerbumComments.postId
		) }`,
		apiNamespace: 'wpcom/v2',
		apiVersion: '2',
	} );
};

/**
 * Hook to handle subscription API calls.
 *
 * @return {object} Object containing functions to manage subscriptions.
 */
export default function useSubscriptionApi() {
	const { subscriptionSettings } = useContext( VerbumSignals );
	const { siteId } = VerbumComments;
	const [ subscriptionSettingsIsLoading, setSubscriptionSettingsIsLoading ] = useState( true );

	const setDefaultSubscriptionSettings = () => {
		subscriptionSettings.value = {
			email: {
				send_posts: false,
				send_comments: false,
				post_delivery_frequency: 'daily',
			},
		} as SubscriptionDetails;
	};

	useEffect( () => {
		setSubscriptionSettingsIsLoading( true );
		getSubscriptionDetails()
			.then( ( data: Record< string, string | SubscriptionDetails > ) => {
				setSubscriptionSettingsIsLoading( false );
				// When a Facebook user doesn't have a subscription, it does not return delivery_methods object.
				// We set the default values for the subscription settings.
				if ( ! data.delivery_methods ) {
					setDefaultSubscriptionSettings();
					return;
				}
				subscriptionSettings.value = data.delivery_methods as SubscriptionDetails;
			} )
			.catch( err => {
				if ( err.message === 'Blog subscription not found' ) {
					// The user isn't subscribed to the blog, don't escalate the error to console.
					// We set the default values for the subscription settings.
					setDefaultSubscriptionSettings();
				}
			} )
			.finally( () => {
				setSubscriptionSettingsIsLoading( false );
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const setEmailPostsSubscription = async function ( change: EmailPostsChange ) {
		let response: EmailSubscriptionResponse;
		if ( change.type === 'frequency' ) {
			response = await wpcomRequest< EmailSubscriptionResponse >( {
				path: `/read/site/${ siteId }/post_email_subscriptions/update`,
				apiVersion: '1.2',
				method: 'POST',
				body: {
					delivery_frequency: change.value,
					track_source: change.trackSource,
				},
			} );
		} else if ( change.type === 'subscribe' ) {
			response = await wpcomRequest< EmailSubscriptionResponse >( {
				path: `/read/site/${ siteId }/post_email_subscriptions/${
					change.value ? 'new' : 'delete'
				}/`,
				apiVersion: '1.2',
				method: 'POST',
				body: {
					track_source: change.trackSource,
				},
			} );
		}

		const subscriptionSettingsValue = subscriptionSettings.peek();
		if ( response.success ) {
			subscriptionSettings.value = {
				...subscriptionSettingsValue,
				email: {
					...subscriptionSettingsValue.email,
					send_posts: response.subscribed,
					post_delivery_frequency: response.subscription?.delivery_frequency ?? 'instantly',
				},
			};
		}
	};

	const setCommentSubscription = async ( subscribe: boolean ) => {
		const comments = await wpcomRequest< Record< string, boolean > >( {
			path: `/read/site/${ siteId }/comment_email_subscriptions/${
				subscribe ? 'new' : 'delete'
			}/?post_id=${ encodeURIComponent( VerbumComments.postId ) }`,
			apiVersion: '1.2',
			method: 'POST',
		} );

		const subscriptionSettingsValue = subscriptionSettings.peek();
		if ( comments.success ) {
			subscriptionSettings.value = {
				...subscriptionSettingsValue,
				email: {
					...subscriptionSettingsValue.email,
					send_comments: comments.subscribed,
				},
			};
		}
	};

	const setNotificationSubscription = async ( subscribe: boolean ) => {
		const notifications = await wpcomRequest< Record< string, boolean > >( {
			path: `/read/sites/${ siteId }/notification-subscriptions/${ subscribe ? 'new' : 'delete' }`,
			apiVersion: '2',
			apiNamespace: 'wpcom/v2',
			method: 'POST',
		} );

		const subscriptionSettingsValue = subscriptionSettings.peek();
		if ( notifications.success ) {
			subscriptionSettings.value = {
				...subscriptionSettingsValue,
				notification: {
					send_posts: notifications.subscribed,
				},
			};
		}
	};

	return {
		subscriptionSettingsIsLoading,
		setEmailPostsSubscription,
		setCommentSubscription,
		setNotificationSubscription,
	};
}
