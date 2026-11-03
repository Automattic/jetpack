import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { ChartScopeContext } from '../../../providers/chart-scope';
import ConversionFunnelChart from '../conversion-funnel-chart';
import type { FunnelStep } from '../types';

const steps: FunnelStep[] = [
	{ id: 'sessions', label: 'Sessions', rate: 100, count: 10000 },
	{ id: 'purchase', label: 'Purchase', rate: 10.3, count: 1030 },
];

const ScopeProbe = () => {
	const scopeNode = useContext( ChartScopeContext );
	return <span data-testid="scope-probe">{ scopeNode ? 'has-scope' : 'no-scope' }</span>;
};

const renderScopeProbe = () => <ScopeProbe />;

describe( 'ConversionFunnelChart chart scope', () => {
	it( 'publishes a non-null scope node after transitioning from empty to populated steps', () => {
		// The normal loading pattern: steps arrives empty first (empty-state branch renders), then populated (main branch renders). The scope node must be republished on that transition, not frozen at whatever the first mount saw.
		const { rerender } = render(
			<ConversionFunnelChart mainRate={ 0 } steps={ [] } renderMainMetric={ renderScopeProbe } />
		);

		rerender(
			<ConversionFunnelChart
				mainRate={ 10.3 }
				steps={ steps }
				renderMainMetric={ renderScopeProbe }
			/>
		);

		expect( screen.getByTestId( 'scope-probe' ) ).toHaveTextContent( 'has-scope' );
	} );
} );
