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
	// TanStack resolves the initial match after `render()`, so await the element.
	it( 'gives its children a matched route whose search params are readable', async () => {
		render(
			<RouteHarness search={ { preset: 'last-7-days' } }>
				<ShowsAppliedPreset />
			</RouteHarness>
		);

		await expect( screen.findByTestId( 'preset' ) ).resolves.toHaveTextContent( 'last-7-days' );
	} );
} );
