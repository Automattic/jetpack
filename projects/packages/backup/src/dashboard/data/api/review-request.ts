import { apiCall, apiPath } from './_helpers';

/**
 * Why the reader is being asked for a review.
 *
 * Doubles as the dismissal's storage key: the route appends it to
 * `dismissed_backup_review_`, and `Jetpack_Options` recognises exactly
 * the two names below — anything else is refused with a PHP warning and
 * silently stores nothing. So this union is not merely a nicety; it is
 * the set of values the server can actually persist.
 */
export type ReviewReason = 'restore' | 'backups';

const DISMISSAL_PATH = '/site/dismissed-review-request';

/**
 * Whether this prompt has already been dismissed.
 *
 * The route is `EDITABLE`, so the read is a POST carrying
 * `should_dismiss: false` — the legacy shape, kept because the option is
 * stored per reason under a name only this route knows how to build, and
 * a second route to read it would be a second thing to keep in step.
 *
 * Fails closed: anything other than a literal `false` reads as dismissed.
 * `false` is what an unset option returns, so it is the one answer that
 * positively means "this person has not said no yet" — and every other
 * outcome, including a shape we do not recognise, leaves us unable to
 * confirm that. Never prompting is the harmless mistake; prompting
 * someone who already declined is not.
 *
 * @param reason - Which prompt to ask about.
 * @return True when the prompt must not be shown.
 */
export async function fetchReviewDismissed( reason: ReviewReason ): Promise< boolean > {
	const dismissed = await apiCall< unknown >( {
		path: apiPath( DISMISSAL_PATH ),
		method: 'POST',
		data: { option_name: reason, should_dismiss: false },
	} );

	return dismissed !== false;
}

/**
 * Record that the reader declined this prompt.
 *
 * Resolves only when the server accepted the write, which is the whole
 * point: the legacy dashboard hid the card the moment the request was
 * sent rather than when it was accepted, so a failed dismissal took the
 * prompt off screen while the server recorded nothing — and it came back
 * on the next page load.
 *
 * The response body is deliberately ignored. `Jetpack_Options::update_option()`
 * forwards WordPress's own `update_option()` return value, which is
 * `false` when the stored value did not change — so a second dismissal of
 * an already-dismissed prompt answers `false` with everything working
 * exactly as intended. Resolution is the signal; the body is not.
 *
 * @param reason - Which prompt was declined.
 */
export async function dismissReviewRequest( reason: ReviewReason ): Promise< void > {
	await apiCall< unknown >( {
		path: apiPath( DISMISSAL_PATH ),
		method: 'POST',
		data: { option_name: reason, should_dismiss: true },
	} );
}
