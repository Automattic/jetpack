import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../comment-form/draft';
import type { Commenter, FormSettings } from './types';

const EMPTY_FORM: FormSettings = {
	postId: 0,
	loginUrl: '',
	logoutUrl: '',
	submitId: 'submit',
	submitName: 'submit',
	submitLabel: '',
};

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

	const isSubmitDisabled = computed(
		() => JetpackComments.mustLogIn || isEmptyComment.value || isSavingComment.value
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

export const CommentSignals = createContext( createSignals( EMPTY_FORM ) );
