import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../form/draft';
import { readPassport } from '../identity/checkpoint/passport';
import type { Details, FormSettings, Commenter } from './types';

/**
 * Build one form's signals.
 *
 * @param formSettings - Values belonging to this form rather than to the page.
 * @return The signals for a single form.
 */
export function createSignals( formSettings: FormSettings ) {
	const { user, mustLogIn, commenter: saved } = JetpackComments;

	const commentValue = signal( readDraft( formSettings.postId ) );
	const isEmptyComment = computed( () => commentValue.value.trim() === '' );
	const isPosting = signal( false );
	const commentParent = signal( 0 );
	const details = signal< Details >( { ...saved } );

	const passport = readPassport();
	let initial: Commenter = { kind: 'unknown' };

	if ( user ) {
		initial = { kind: 'user', name: user.name };
	} else if ( passport ) {
		initial = { kind: 'wordpress', ...passport, code: null };
	} else if ( ! mustLogIn && saved.author !== '' && saved.email !== '' ) {
		// A site that now requires registration no longer knows a guest, saved or not.
		initial = { kind: 'guest' };
	}

	const commenter = signal< Commenter >( initial );
	// Whether core keeps a guest's details; saved ones were saved with consent.
	const rememberDetails = signal( initial.kind === 'guest' );

	// The bar under the text box with the commenter and the submit, the row the
	// chevron drops below it, and the dialog that asks who they are.
	const isFooterOpen = signal( false );
	const isOptionsOpen = signal( false );
	const isDialogOpen = signal( false );
	const isEditingDetails = signal( false );

	return {
		formSettings,
		commentValue,
		isEmptyComment,
		isPosting,
		commentParent,
		details,
		commenter,
		rememberDetails,
		isFooterOpen,
		isOptionsOpen,
		isDialogOpen,
		isEditingDetails,
	} as const;
}

export type CommentSignalsValue = ReturnType< typeof createSignals >;

// Never the value in use: every form renders inside a Provider. Building real
// signals here would read the settings blob and sessionStorage at import time.
export const CommentSignals = createContext< CommentSignalsValue >(
	undefined as unknown as CommentSignalsValue
);
