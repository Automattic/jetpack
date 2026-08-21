import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../comment-form/draft';
import type { Commenter } from './types';

/**
 * Build one form's signals.
 *
 * @param postId - The post this form comments on.
 * @return The signals for a single form.
 */
export function createSignals( postId: number ) {
	const commentValue = signal( readDraft( postId ) );

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
		postId,
		commentValue,
		isEmptyComment,
		isSavingComment,
		commentParent,
		commenter,
		isSubmitDisabled,
	} as const;
}

export const CommentSignals = createContext( createSignals( 0 ) );
