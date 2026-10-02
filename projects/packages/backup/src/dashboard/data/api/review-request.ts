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
 * The route is `EDITABLE`, so the read is a POST carrying `should_dismiss:
 * false` — legacy's shape, kept because only the route knows how to build the
 * per-reason option name. Fails closed: only a literal `false`, what an unset
 * option returns, means "has not said no yet".
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
 * Resolves only on acceptance: legacy hid the card when the request was *sent*,
 * so a failed dismissal took the prompt off screen and it returned on the next
 * load. The body is ignored — `Jetpack_Options::update_option()` forwards
 * `update_option()`, which answers `false` for an unchanged value.
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
