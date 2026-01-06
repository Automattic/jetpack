/**
 * External dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { safeHTML } from '@wordpress/dom';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
import type { FeedbackComment } from '../../../types';

export type CommentItemProps = {
	comment: FeedbackComment;
	onDelete: ( id: number ) => void;
	isDeleting: boolean;
};

/**
 * Format comment date using WP settings.
 *
 * @param dateString - ISO date string from the comment
 * @return Formatted date/time string
 */
function formatCommentDate( dateString: string ) {
	return sprintf(
		/* Translators: %1$s is the date, %2$s is the time. */
		__( '%1$s at %2$s', 'jetpack-forms' ),
		dateI18n( getDateSettings().formats.date, dateString ),
		dateI18n( getDateSettings().formats.time, dateString )
	);
}

/**
 * Renders a single feedback comment item, including author, date, content,
 * and an options menu to delete the comment.
 *
 * @param {CommentItemProps}     props            - Component props.
 * @param {FeedbackComment}      props.comment    - The feedback comment to display.
 * @param {(id: number) => void} props.onDelete   - Callback invoked when the delete action is selected.
 * @param {boolean}              props.isDeleting - Whether a delete operation is currently in progress.
 * @return {JSX.Element} The rendered feedback comment item element.
 */
const CommentItem = ( { comment, onDelete, isDeleting }: CommentItemProps ) => {
	return (
		<div key={ comment.id } className="jp-forms__feedback-comments-comment">
			<div className="jp-forms__feedback-comments-comment-meta">
				<strong className="jp-forms__feedback-comments-comment-author">
					{ comment.author_name }
				</strong>
				<span className="jp-forms__feedback-comments-comment-date">
					{ formatCommentDate( comment.date ) }
				</span>
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Note options', 'jetpack-forms' ) }
					controls={ [
						{
							title: __( 'Delete', 'jetpack-forms' ),
							icon: trash,
							onClick: () => onDelete( comment.id ),
							isDisabled: isDeleting,
						},
					] }
				/>
			</div>
			<div
				className="jp-forms__feedback-comments-comment-content"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ { __html: safeHTML( comment.content.rendered ) } }
			/>
		</div>
	);
};

export default CommentItem;
