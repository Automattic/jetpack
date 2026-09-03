/**
 * Internal dependencies
 */
import { fetchStatsProxy } from './stats-proxy-fetch';

// Reaches Happiness as the subject line of the feedback email ("Feedback received
// from …"), so it has to name the surface without any further context.
const PRODUCT_NAME = 'Jetpack Stats Traffic tab preview';

export type StatsUserFeedback = {
	rating: number;
	comment: string;
};

/**
 * Send dashboard feedback to the WPCOM Stats feedback endpoint, which emails it on and
 * opens a Zendesk ticket.
 *
 * The endpoint requires a message, so a rating with no comment is not submittable here —
 * Tracks carries the rating either way.
 *
 * @param feedback         - The reader's submission.
 * @param feedback.rating  - Where the reader placed the new tab on the comparison scale, 1 to 5.
 * @param feedback.comment - The reader's message. Must not be empty.
 * @return The endpoint's response.
 */
export function submitStatsUserFeedback( { rating, comment }: StatsUserFeedback ) {
	return fetchStatsProxy( {
		version: '2',
		endpoint: 'jetpack-stats/user-feedback',
		method: 'POST',
		body: {
			source_url: window.location.href,
			product_name: PRODUCT_NAME,
			feedback: comment,
			rating,
		},
	} );
}
