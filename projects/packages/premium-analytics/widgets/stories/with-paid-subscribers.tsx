/**
 * Internal dependencies
 */
import { MOCK_PAID_SUBSCRIBERS } from '../../packages/widgets-toolkit/src/stories/mocks/data';
import { setMockSitePaidSubscribers } from '../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';

export interface PaidSubscribersControls {
	hasPaidSubscribers?: boolean;
}

export const paidSubscribersArgTypes = {
	hasPaidSubscribers: {
		control: 'boolean',
		description:
			'Whether the mocked site sells subscriptions. One switch drives both `subscribers/counts` and the `stats/subscribers` series, so every widget reading either agrees about the same site.',
	},
} as const;

/**
 * Puts the mocked site's paid subscribers under a story control, so one toggle
 * switches a widget between the paid and unpaid versions of the same site.
 *
 * A `beforeEach` rather than a decorator: the switch clears the shared query
 * cache, and doing that from a decorator's render or effect cancels the fetches
 * the same toggle just started, leaving the widget on its skeleton.
 *
 * @param context      - The story context.
 * @param context.args - The story's args, read for `hasPaidSubscribers`.
 * @return Cleanup restoring the unpaid default.
 */
export function withPaidSubscribers( { args }: { args: PaidSubscribersControls } ) {
	setMockSitePaidSubscribers( args.hasPaidSubscribers ? MOCK_PAID_SUBSCRIBERS : 0 );

	return () => setMockSitePaidSubscribers( 0 );
}
