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
		return { total_sends: 1000, total_opens: 400, total_clicks: 40, clicks_rate: 3.81 };
	}

	return { total_sends: 1000, total_opens: 400, unique_opens: 380, opens_rate: 38.1 };
}
