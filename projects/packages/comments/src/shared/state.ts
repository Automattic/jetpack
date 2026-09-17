import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../form/draft';
import { readPassport } from '../identity/checkpoint/passport';
import type { Commenter, FormSettings, Provider, SignedIn } from './types';

/**
 * Build one form's signals.
 *
 * @param formSettings - Values belonging to this form rather than to the page.
 * @return The signals for a single form.
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

	// Which sign-in the reader has picked: a provider while its popup is open, or mail.
	const activeService = signal< '' | 'mail' | Provider >( '' );

	const isSigningIn = computed(
		() => activeService.value !== '' && activeService.value !== 'mail'
	);

	const signInError = signal( '' );

	// The identity tray under the textarea: opened by typing, or by the gear once signed in.
	const isTrayOpen = signal( false );

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
		isSubmitDisabled,
	} as const;
}

export type CommentSignalsValue = ReturnType< typeof createSignals >;

/**
 * Every form renders inside a Provider, so this default is never the one in use.
 * It is empty because createContext() insists on a value, and building real
 * signals here would read the settings blob and sessionStorage at import time,
 * before either is known to be there.
 */
export const CommentSignals = createContext< CommentSignalsValue >(
	undefined as unknown as CommentSignalsValue
);
