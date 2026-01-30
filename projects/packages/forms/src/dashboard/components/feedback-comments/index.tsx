/**
 * External dependencies
 */
import { Button, TextareaControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import CommentItem from './comment-item';
import type { FeedbackComment } from '../../../types';
import './style.scss';

export type FeedbackCommentsProps = {
	postId: number;
};

/**
 * Component for displaying and adding comments to feedback posts.
 * Uses WordPress core comments REST API (wp/v2/comments).
 *
 * @param {FeedbackCommentsProps} props - Component props
 * @return {JSX.Element} The feedback comments component
 */
const FeedbackComments = ( { postId }: FeedbackCommentsProps ): JSX.Element => {
	const [ newComment, setNewComment ] = useState( '' );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ deletingCommentIds, setDeletingCommentIds ] = useState< Set< number > >( new Set() );
	const [ error, setError ] = useState< string | null >( null );
	// Page-based loading: fetch one page at a time and append to `loadedComments`.
	const [ page, setPage ] = useState( 1 );
	const perPage = 50;
	const [ loadedComments, setLoadedComments ] = useState< FeedbackComment[] >( [] );
	// Comments created in this session (locally appended) — shown after the "Load more" button.
	const [ clientAddedComments, setClientAddedComments ] = useState< FeedbackComment[] >( [] );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { deleteEntityRecord, saveEntityRecord } = useDispatch( coreStore );

	// Get current user data
	const currentUser = useSelect( select => {
		return select( coreStore ).getCurrentUser();
	}, [] );

	const {
		comments: commentsPage,
		totalComments,
		isLoadingComments,
	} = useSelect(
		select => {
			const commentsData = select( coreStore ).getEntityRecords( 'root', 'comment', {
				per_page: perPage,
				page,
				orderby: 'date',
				order: 'asc',
				post: postId,
			} ) as FeedbackComment[] | null | undefined;

			const total = select( coreStore ).getEntityRecordsTotalItems( 'root', 'comment', {
				per_page: perPage,
				page,
				post: postId,
			} );

			return {
				comments: commentsData,
				totalComments: total || 0,
				isLoadingComments: commentsData === undefined || commentsData === null,
			};
		},
		[ postId, page ]
	);
	const hasMoreComments = page * perPage < ( totalComments || 0 );
	useEffect( () => {
		// If the selector returned nothing yet, do nothing.
		if ( ! commentsPage ) {
			return;
		}

		// If the API returned an error object (not an array), surface it.
		if ( ! Array.isArray( commentsPage ) ) {
			const message =
				( commentsPage as { message?: string } ).message ||
				__( 'Failed to load comments. Please try again.', 'jetpack-forms' );
			setError( message );
			return;
		}

		// Clear any previous load error on successful array result.
		setError( null );

		if ( commentsPage.length === 0 ) {
			return;
		}

		setLoadedComments( prev => {
			const existing = new Set( prev.map( c => c.id ) );
			const toAdd = commentsPage.filter( c => ! existing.has( c.id ) );
			// Remove any client-added comments that the server just returned.
			setClientAddedComments( prevClient =>
				prevClient.filter( c => ! commentsPage.some( pc => pc.id === c.id ) )
			);
			return prev.concat( toAdd );
		} );
	}, [ commentsPage ] );

	useEffect( () => {
		setLoadedComments( [] );
		setClientAddedComments( [] );
		setPage( 1 );
	}, [ postId ] );

	const scrollToBottom = useCallback( () => {
		const button = document.querySelector( '.jp-forms__feedback-comments-form-button' );
		if ( button ) {
			button.scrollIntoView( { behavior: 'smooth', block: 'nearest' } );
		}
	}, [] );

	const handleLoadMore = useCallback( () => {
		setPage( prevPage => prevPage + 1 );
	}, [] );

	const handleNewComment = useCallback( async () => {
		if ( ! newComment.trim() ) {
			return;
		}

		setIsSubmitting( true );
		setError( null );

		try {
			const saved = await saveEntityRecord( 'root', 'comment', {
				post: postId,
				content: newComment,
			} );

			if ( saved === undefined ) {
				setError( __( 'Failed to save the note. Please try again.', 'jetpack-forms' ) );
				createErrorNotice( __( 'Failed to save the note.', 'jetpack-forms' ) );
				setIsSubmitting( false );
				return;
			}

			setNewComment( '' );
			createSuccessNotice( __( 'Note added successfully.', 'jetpack-forms' ) );
			// Append the newly saved comment to the client-only list so it appears
			// after the "Load more comments" button.
			setClientAddedComments( prev => {
				if ( ! saved || ! ( saved as FeedbackComment ).id ) {
					return prev;
				}

				const savedComment = saved as FeedbackComment;
				const existing = new Set( prev.map( c => c.id ) );
				if ( existing.has( savedComment.id ) ) {
					return prev;
				}
				return prev.concat( savedComment );
			} );
			scrollToBottom();
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( err ) {
			setError( __( 'Failed to save the note. Please try again.', 'jetpack-forms' ) );
			createErrorNotice( __( 'Failed to save the note.', 'jetpack-forms' ) );
		} finally {
			setIsSubmitting( false );
		}
	}, [
		newComment,
		saveEntityRecord,
		postId,
		createSuccessNotice,
		scrollToBottom,
		createErrorNotice,
	] );

	const handleKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLTextAreaElement > ) => {
			// Submit on Enter (without Shift) - works with mobile "Send" button
			// Use Shift+Enter for new lines
			if ( event.key === 'Enter' && ! event.shiftKey ) {
				event.preventDefault();
				handleNewComment();
			}
		},
		[ handleNewComment ]
	);

	const handleDelete = useCallback(
		async ( commentId: number ) => {
			setDeletingCommentIds( prev => {
				const next = new Set( prev );
				next.add( commentId );
				return next;
			} );
			try {
				await deleteEntityRecord( 'root', 'comment', commentId, {}, { throwOnError: true } );
				createSuccessNotice( __( 'Note deleted.', 'jetpack-forms' ) );
				// Remove deleted comment from local lists so UI updates immediately.
				setLoadedComments( prev => prev.filter( c => c.id !== commentId ) );
				setClientAddedComments( prev => prev.filter( c => c.id !== commentId ) );
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch ( err ) {
				setError( __( 'Failed to delete the note. Please try again.', 'jetpack-forms' ) );
				createErrorNotice( __( 'Failed to delete the note.', 'jetpack-forms' ) );
			} finally {
				setDeletingCommentIds( prev => {
					const next = new Set( prev );
					next.delete( commentId );
					return next;
				} );
			}
		},
		[ deleteEntityRecord, createSuccessNotice, createErrorNotice ]
	);

	// Date formatting is handled in the CommentItem component now.

	return (
		<div className="jp-forms__feedback-comments">
			<h3 className="jp-forms__feedback-comments-heading">
				{ __( 'Notes', 'jetpack-forms' ) }

				{ isLoadingComments && (
					<span className="jp-forms__feedback-loading">
						<Spinner height={ 12 } width={ 12 } />
					</span>
				) }
			</h3>

			<div className="jp-forms__feedback-comments-content">
				{ ! isLoadingComments && loadedComments.length > 0 && (
					<div className="jp-forms__feedback-comments-list">
						{ loadedComments.map( comment => (
							<CommentItem
								key={ comment.id }
								comment={ comment }
								onDelete={ handleDelete }
								isDeleting={ deletingCommentIds.has( comment.id ) }
							/>
						) ) }
					</div>
				) }

				{ ! isLoadingComments && hasMoreComments && (
					<div className="jp-forms__feedback-comments-load-more">
						<Button variant="secondary" onClick={ handleLoadMore }>
							{ __( 'Load more comments', 'jetpack-forms' ) }
						</Button>
					</div>
				) }

				{ clientAddedComments.length > 0 && (
					<div className="jp-forms__feedback-comments-list jp-forms__feedback-comments-new">
						{ clientAddedComments.map( comment => (
							<CommentItem
								key={ comment.id }
								comment={ comment }
								onDelete={ handleDelete }
								isDeleting={ deletingCommentIds.has( comment.id ) }
							/>
						) ) }
					</div>
				) }
			</div>

			{ /* Add comment form */ }
			<div className="jp-forms__feedback-comments-form">
				{ error && <div className="jp-forms__feedback-comments-error">{ error }</div> }
				<div className="jp-forms__feedback-comments-form-wrapper">
					<div className="jp-forms__feedback-comments-form-input">
						<TextareaControl
							hideLabelFromVision
							label={ __( 'Leave a note', 'jetpack-forms' ) }
							value={ newComment }
							onChange={ setNewComment }
							onKeyDown={ handleKeyDown }
							onBlur={ scrollToBottom }
							enterKeyHint="send"
							rows={ 1 }
							disabled={ isSubmitting }
							placeholder={ __( 'Write a quick note…', 'jetpack-forms' ) }
						/>
					</div>
					<div className="jp-forms__feedback-comments-user-info">
						{ currentUser && (
							<div className="jp-forms__feedback-comments-form-avatar">
								<img src={ currentUser.avatar_urls?.[ '48' ] || '' } alt={ '' } />
								<strong>{ currentUser.name }</strong>
							</div>
						) }
						<div className="jp-forms__feedback-comments-form-button">
							<Button
								variant="primary"
								type="submit"
								onClick={ handleNewComment }
								disabled={ isSubmitting || ! newComment.trim() }
								isBusy={ isSubmitting }
							>
								{ __( 'Add note', 'jetpack-forms' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FeedbackComments;
