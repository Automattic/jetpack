import { signal, computed } from '@preact/signals';
import { createContext } from 'preact';
import { readDraft } from '../comment-form/draft';
import type { Commenter } from './types';

/**
 * Build one set of signals. A page can carry several comment forms, and each
 * gets its own.
 *
 * @param postId - The post this form comments on.
 * @return The signals for a single form.
 */
export function createSignals( postId: number ) {
	// Seeded from an unsent draft, if this tab still has one.
	const commentValue = signal( readDraft( postId ) );

	const isEmptyComment = computed( () => commentValue.value.trim() === '' );

	const isSavingComment = signal( false );

	// WordPress rewrites #comment_parent when the reader clicks Reply.
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
