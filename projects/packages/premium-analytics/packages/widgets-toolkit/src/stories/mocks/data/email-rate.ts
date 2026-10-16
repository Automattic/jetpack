/**
 * Builds a mock all-time `stats/<opens|clicks>/emails/<postId>/rate` response so
 * the Email top row widget renders populated in Storybook. The `rate` breakdown
 * is a flat object of scalar totals; each endpoint only carries the fields for
 * its view (see the upstream Calypso `emailStatsAlltimeTransform`), which the
 * data layer's summary sanitizer keeps as numbers.
 *
 * @param metric - Which view's totals to return.
 * @return Raw email rate-breakdown response.
 */
export function buildEmailRateResponse( metric: 'opens' | 'clicks' ) {
	if ( metric === 'clicks' ) {
		return {
			total_clicks: 40,
			unique_clicks: 38,
			total_sends: 1000,
			total_opens: 400,
			clicks_rate: 0.038,
		};
	}

	return { total_sends: 1000, unique_opens: 381, total_opens: 400, opens_rate: 0.381 };
}
