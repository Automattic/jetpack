import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../form/draft';
import { readPassport } from '../identity/checkpoint/passport';
import type { Commenter, FormSettings, SignedIn } from './types';

/**
 * Build one form's signals.
 *
 * @param formSettings - Values belonging to this form rather than to the page.
 * @return The signals for a single form.
 */
export function createSignals( formSettings: FormSettings ) {
	const { isLoggedIn, mustLogIn, commenter: saved } = JetpackComments;

	const commentValue = signal( readDraft( formSettings.postId ) );
	const isEmptyComment = computed( () => commentValue.value.trim() === '' );
	const isSavingComment = signal( false );
	const commentParent = signal( 0 );
	const commenter = signal< Commenter >( { ...saved } );

	const passport = readPassport();
	const signedIn = signal< SignedIn | null >( passport ? { ...passport, code: null } : null );

	// A site that now requires registration no longer knows a guest, saved or not.
	const isSavedGuest = ! isLoggedIn && ! mustLogIn && saved.author !== '' && saved.email !== '';
	const isKnown = computed( () => isLoggedIn || signedIn.value !== null || isSavedGuest );

	const isTrayOpen = signal( false );
	const isDialogOpen = signal( false );
	const isEditing = signal( false );

	return {
		formSettings,
		commentValue,
		isEmptyComment,
		isSavingComment,
		commentParent,
		commenter,
		signedIn,
		isSavedGuest,
		isKnown,
		isTrayOpen,
		isDialogOpen,
		isEditing,
	} as const;
}

export type CommentSignalsValue = ReturnType< typeof createSignals >;

// Never the value in use: every form renders inside a Provider. Building real
// signals here would read the settings blob and sessionStorage at import time.
export const CommentSignals = createContext< CommentSignalsValue >(
	undefined as unknown as CommentSignalsValue
);
