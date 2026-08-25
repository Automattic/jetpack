import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../form/draft';
import { identityUser, isConnecting } from './identity';
import type { Commenter, FormSettings } from './types';

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

	// identityUser and isConnecting are page-global (shared/identity.ts); submission waits on both.
	const isSubmitDisabled = computed(
		() =>
			( JetpackComments.mustLogIn && ! identityUser.value ) ||
			isEmptyComment.value ||
			isSavingComment.value ||
			isConnecting.value
	);

	return {
		formSettings,
		commentValue,
		isEmptyComment,
		isSavingComment,
		commentParent,
		commenter,
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
