/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, TextareaControl, DropdownMenu, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
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
	const [ comments, setComments ] = useState< FeedbackComment[] >( [] );
	const [ isLoadingComments, setIsLoadingComments ] = useState( true );
	const [ newComment, setNewComment ] = useState( '' );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// Get current user data
	const currentUser = useSelect( select => {
		return select( coreStore ).getCurrentUser();
	}, [] );

	const loadComments = useCallback( async () => {
		setIsLoadingComments( true );
		setError( null );

		try {
			const fetchedComments = await apiFetch< FeedbackComment[] >( {
				path: `/wp/v2/comments?post=${ postId }&per_page=100&order=asc`,
			} );
			setComments( fetchedComments || [] );
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( err ) {
			setError( __( 'Failed to load comments.', 'jetpack-forms' ) );
			createErrorNotice( __( 'Failed to load comments.', 'jetpack-forms' ) );
		} finally {
			setIsLoadingComments( false );
		}
	}, [ postId, createErrorNotice ] );

	// Load comments on mount and when postId changes
	useEffect( () => {
		loadComments();
	}, [ postId, createErrorNotice, loadComments, setIsLoadingComments, setError, setComments ] );

	const handleSubmit = useCallback( async () => {
		if ( ! newComment.trim() ) {
			return;
		}

		setIsSubmitting( true );
		setError( null );

		try {
			const createdComment = await apiFetch< FeedbackComment >( {
				path: '/wp/v2/comments',
				method: 'POST',
				data: {
					post: postId,
					content: newComment,
				},
			} );

			setComments( [ ...comments, createdComment ] );
			setNewComment( '' );
			createSuccessNotice( __( 'Note added successfully.', 'jetpack-forms' ) );
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( err ) {
			setError( __( 'Failed to save the note. Please try again.', 'jetpack-forms' ) );
			createErrorNotice( __( 'Failed to save the note.', 'jetpack-forms' ) );
		} finally {
			setIsSubmitting( false );
		}
	}, [ newComment, postId, comments, createSuccessNotice, createErrorNotice ] );

	const handleDelete = useCallback(
		async ( commentId: number ) => {
			if ( comments.length === 0 ) {
				return;
			}
			setIsDeleting( true );
			try {
				await apiFetch( {
					path: `/wp/v2/comments/${ commentId }`,
					method: 'DELETE',
				} );

				setComments( comments.filter( c => c.id !== commentId ) );
				createSuccessNotice( __( 'Note deleted.', 'jetpack-forms' ) );
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch ( err ) {
				setError( __( 'Failed to delete the note. Please try again.', 'jetpack-forms' ) );
				createErrorNotice( __( 'Failed to delete the note.', 'jetpack-forms' ) );
			} finally {
				setIsDeleting( false );
			}
		},
		[ comments, createSuccessNotice, createErrorNotice ]
	);

	const formatCommentDate = ( dateString: string ) => {
		return sprintf(
			/* Translators: %1$s is the date, %2$s is the time. */
			__( '%1$s at %2$s', 'jetpack-forms' ),
			dateI18n( getDateSettings().formats.date, dateString ),
			dateI18n( getDateSettings().formats.time, dateString )
		);
	};

	return (
		<div className="jp-forms__feedback-comments">
			<h3 className="jp-forms__feedback-comments-heading">
				{ __( 'Notes', 'jetpack-forms' ) }

				{ isLoadingComments && (
					<span className="jp-forms__feedback-loading">
						<Spinner size={ 12 } />
					</span>
				) }
			</h3>

			<div className="jp-forms__feedback-comments-content">
				{ ! isLoadingComments && comments.length > 0 && (
					<div className="jp-forms__feedback-comments-list">
						{ comments.map( comment => (
							<div key={ comment.id } className="jp-forms__feedback-comment">
								<div className="jp-forms__feedback-comment-meta">
									<strong className="jp-forms__feedback-comment-author">
										{ comment.author_name }
									</strong>
									<span className="jp-forms__feedback-comment-date">
										{ formatCommentDate( comment.date ) }
									</span>
									<DropdownMenu
										icon={ moreVertical }
										label={ __( 'Note options', 'jetpack-forms' ) }
										controls={ [
											{
												title: __( 'Delete', 'jetpack-forms' ),
												icon: trash,
												onClick: () => handleDelete( comment.id ),
												isDisabled: isDeleting,
											},
										] }
									/>
								</div>
								<div
									className="jp-forms__feedback-comment-content"
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={ { __html: comment.content.rendered } }
								/>
							</div>
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
							rows={ 1 }
							disabled={ isSubmitting }
							placeholder={ __( 'Write a quick note…', 'jetpack-forms' ) }
						/>
					</div>
					<div className="jp-forms__feedback-comments-user-info">
						{ currentUser && (
							<div className="jp-forms__feedback-comments-form-avatar">
								<img src={ currentUser.avatar_urls?.[ '48' ] || '' } alt={ currentUser.name } />
								<strong>{ currentUser.name }</strong>
							</div>
						) }
						<div className="jp-forms__feedback-comments-form-button">
							<Button
								variant="primary"
								onClick={ handleSubmit }
								disabled={ isSubmitting || ! newComment.trim() }
								isBusy={ isSubmitting }
							>
								{ __( 'Post', 'jetpack-forms' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FeedbackComments;
