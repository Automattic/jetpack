import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * The information needed, about whether a post is scheduled, to enforce the sharing limits.
 * @typedef {object} EditedScheduledPost
 * @property {boolean} isScheduled - Whether the post being edited is scheduled
 * @property {number} daysUntilPublish - The number of days until the post is to be published
 * @property {boolean} isScheduledWithin30Days - Whether the post isScheduled and daysUntilPublish is than 30
 */

/**
 * Returns whether the post is scheduled and whether it will be published
 * in the next 30 days, for use with determining if we should include it in
 * the share limits.
 *
 * @returns {EditedScheduledPost} A {@link EditedScheduledPost} object
 */
export function useScheduledPost() {
	return useSelect( select => {
		const isScheduled = select( editorStore ).isEditedPostBeingScheduled();
		const daysUntilPublish =
			Math.abs(
				new Date().getTime() -
					new Date( select( editorStore ).getEditedPostAttribute( 'date' ) ).getTime()
			) /
			( 1000 * 3600 * 24 );
		const isScheduledWithin30Days = isScheduled && daysUntilPublish <= 30;

		return {
			isScheduled,
			daysUntilPublish,
			isScheduledWithin30Days,
		};
	}, [] );
}
