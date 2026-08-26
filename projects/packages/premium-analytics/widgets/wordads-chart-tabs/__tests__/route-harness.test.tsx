/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { RouteHarness } from '../route-harness';

function ShowsAppliedPreset() {
	const { appliedPresetId } = useReportDateFilters( '/' );

	return <div data-testid="preset">{ appliedPresetId ?? 'none' }</div>;
}

describe( 'RouteHarness', () => {
	// `useReportDateFilters` calls `useNavigate` and `useSearch`, both of which
	// need a live match. This is the assertion that the harness provides one.
	//
	// The initial match resolves a tick after `render()` returns (TanStack
	// Router matches asynchronously even for a route with no loader), so this
	// awaits `findByTestId` rather than asserting with `getByTestId` right
	// away. A harness that doesn't really match still fails loudly here: with
	// no matched route, `useSearch` throws its "Could not find an active
	// match" invariant synchronously during `render()`, before this line runs.
	it( 'gives its children a matched route whose search params are readable', async () => {
		render(
			<RouteHarness search={ { preset: 'last-7-days' } }>
				<ShowsAppliedPreset />
			</RouteHarness>
		);

		await expect( screen.findByTestId( 'preset' ) ).resolves.toHaveTextContent( 'last-7-days' );
	} );
} );
