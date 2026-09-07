/**
 * Internal dependencies
 */
import { fetchStatsProxy } from './stats-proxy-fetch';

/** Where the reader placed the new tab on the comparison scale, worst to best. */
export type StatsFeedbackRating = 1 | 2 | 3 | 4 | 5;

export type StatsUserFeedback = {
	rating: StatsFeedbackRating;
	comment: string;
	productName: string;
};

/**
 * Send dashboard feedback to the WPCOM Stats feedback endpoint, which emails it on and
 * opens a Zendesk ticket.
 *
 * The endpoint requires a message, so a rating with no comment is not submittable here —
 * Tracks carries the rating either way.
 *
 * It also throttles per site per day rather than per user, so on a multi-author site a
 * co-author's earlier submission silently drops this one. Tracks still has it.
 *
 * @param feedback             - The reader's submission.
 * @param feedback.rating      - Where the reader placed the new tab on the comparison scale.
 * @param feedback.comment     - The reader's message. Must not be empty.
 * @param feedback.productName - The surface being reviewed. Reaches Happiness as the email
 *                             subject line, so it has to stand alone.
 * @return The endpoint's response.
 */
export function submitStatsUserFeedback( { rating, comment, productName }: StatsUserFeedback ) {
	return fetchStatsProxy( {
		version: '2',
		endpoint: 'jetpack-stats/user-feedback',
		method: 'POST',
		body: {
			source_url: window.location.href,
			product_name: productName,
			feedback: comment,
			rating,
		},
	} );
}
