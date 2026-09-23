import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../form/draft';
import { readPassport } from '../identity/passport';
import type { Commenter, FormSettings } from './types';
import type { Provider, SignedIn } from '../identity/types';
import type { SubscriptionState } from '../tray/subscriptions/types';

/**
 * One form's signals.
 *
 * @param formSettings - This form's settings.
 * @return The signals.
 */
export function createSignals( formSettings: FormSettings ) {
	const commentValue = signal( readDraft( formSettings.postId ) );

	const isEmptyComment = computed( () => commentValue.value.trim() === '' );

	const isSavingComment = signal( false );

	const commentParent = signal( 0 );

	const commenter = signal< Commenter >( {
		author: JetpackComments.commenter.author,
		email: JetpackComments.commenter.email,
		url: JetpackComments.commenter.url,
	} );

	const passport = readPassport();

	const signedIn = signal< SignedIn | null >( passport ? { ...passport, code: null } : null );

	const activeService = signal< '' | 'mail' | Provider >( '' );

	const isSigningIn = computed(
		() => activeService.value !== '' && activeService.value !== 'mail'
	);

	const signInError = signal( '' );

	const isTrayOpen = signal( false );

	const isSignedIn = computed( () => Boolean( JetpackComments.user ) || signedIn.value !== null );

	const subscriptions = signal< SubscriptionState | null | undefined >( undefined );

	const isSubmitDisabled = computed(
		() =>
			( JetpackComments.mustLogIn && ! signedIn.value ) ||
			isSigningIn.value ||
			isEmptyComment.value ||
			isSavingComment.value
	);

	return {
		formSettings,
		commentValue,
		isEmptyComment,
		isSavingComment,
		commentParent,
		commenter,
		signedIn,
		activeService,
		isSigningIn,
		signInError,
		isTrayOpen,
		isSignedIn,
		subscriptions,
		isSubmitDisabled,
	} as const;
}

export type CommentSignalsValue = ReturnType< typeof createSignals >;

// A placeholder: real signals here would read the settings blob at import time.
export const CommentSignals = createContext< CommentSignalsValue >(
	undefined as unknown as CommentSignalsValue
);
