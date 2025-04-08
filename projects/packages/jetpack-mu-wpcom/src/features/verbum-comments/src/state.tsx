import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { canWeAccessCookies, getUserInfoCookie, isAuthRequired, isEmptyEditor } from './utils';
import type { UserInfo, SubscriptionDetails } from './types';
import type { Signal } from '@preact/signals';

/**
 * Creates an instance of the app state.
 *
 * @return An object containing all the signals used in the app.
 */
export function createSignals() {
	/*
	 * In userInfo we store the user data for logged-in users.
	 */
	const userInfo: Signal< UserInfo > = signal( getUserInfoCookie() );

	/*
	 * Calculate if user is logged in. For self-hosted sites this check is based only on VerbumComments.isJetpackCommentsLoggedIn.
	 * Here we also check if cookies are accessible, userInfo is set and the service is different from 'guest' or 'jetpack'.
	 */
	const userLoggedIn = computed( () => {
		return (
			VerbumComments.isJetpackCommentsLoggedIn ||
			( canWeAccessCookies() &&
				userInfo.value &&
				userInfo.value?.service !== 'guest' &&
				userInfo.value?.service !== 'jetpack' )
		);
	} );

	/*
	 * Store user input: email, author and url from email form.
	 */
	const mailLoginData = signal( {
		email: '',
		author: '',
		url: '',
	} );

	/*
	 * Indicate whether the tray showing the subscription options is open.
	 */
	const isTrayOpen = signal( false );

	/*
	 * Indicate whether the subscription option tray has been opened once.
	 */
	const hasOpenedTrayOnce = signal( false );

	/*
	 * Store the value of the comment input field.
	 */
	const commentValue = signal( '' );

	/*
	 * Calculate if the comment value is empty.
	 */
	const isEmptyComment = computed( () => {
		return isEmptyEditor( commentValue.value );
	} );

	/*
	 * Indicate whether we are saving the comment.
	 */
	const isSavingComment = signal( false );

	/*
	 * isMailFormInvalid is used to if the required email form data was not properly filled.
	 */
	const isMailFormInvalid = signal( false );

	/*
	 * isMailFormMissingInput is used to determine if the mail input is not set.
	 */
	const isMailFormMissingInput = computed( () => {
		return ! mailLoginData.value.email || ! mailLoginData.value.author;
	} );

	/*
	 * Calculate if the reply button should be disabled. When we have no user data we check the shouldDisableReply value,
	 * otherwise we check if the comment is empty or saving.
	 */
	const isReplyDisabled = computed( () => {
		return (
			( isAuthRequired() &&
				! userLoggedIn.value &&
				( isMailFormMissingInput.value || isMailFormInvalid.value ) ) ||
			isEmptyComment.value ||
			isSavingComment.value
		);
	} );

	/*
	 * commentUrl is used to store the url of the comment page.
	 * This is used to redirect the user to the comment page after the comment is saved.
	 */
	const commentUrl = signal( '' );

	/*
	 * Indicate whether we need to store the email data. If set we use this to store the user info cookie.
	 */
	const shouldStoreEmailData = signal( false );

	//
	const subscriptionSettings: Signal< SubscriptionDetails > = signal( undefined );

	/*
	 * Store the comment parent which is updated by external scripts
	 */
	const commentParent = signal( 0 );

	/*
	 * Store the subscription modal status calculated for the user.
	 * Can be one of these values: 'showed', 'hidden_cookies_disabled', 'hidden_subscribe_not_enabled', 'hidden_views_limit' and 'hidden_already_subscribed'.
	 */
	const subscribeModalStatus = signal( undefined );

	return {
		userInfo,
		userLoggedIn,
		mailLoginData,
		isTrayOpen,
		hasOpenedTrayOnce,
		commentValue,
		isEmptyComment,
		isSavingComment,
		isMailFormInvalid,
		isMailFormMissingInput,
		isReplyDisabled,
		commentUrl,
		shouldStoreEmailData,
		subscriptionSettings,
		commentParent,
		subscribeModalStatus,
	} as const;
}

export const VerbumSignals = createContext( createSignals() );
