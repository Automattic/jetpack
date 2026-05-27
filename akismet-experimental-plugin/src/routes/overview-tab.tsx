/**
 * `<OverviewTab>` — composes the four Overview-tab sections:
 *   - <IntervalSelector>
 *   - <ThreatKPIs>
 *   - <CategoryGrid>
 *   - <WooCommercePanel>
 *
 * Empty state when no API key is configured. The drill-down callback
 * is wired up by <App> once Plan 3's Activity tab lands; for now it
 * receives the category id and may no-op or update the URL.
 */
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useApiKey } from '@/hooks/use-api-key';
import { CategoryGrid } from '@/routes/overview/category-grid';
import { OverviewEmptyState } from '@/routes/overview/empty-state';
import { IntervalSelector } from '@/routes/overview/interval-selector';
import { ThreatKPIs } from '@/routes/overview/threat-kpis';
import { WooCommercePanel } from '@/routes/overview/woocommerce-panel';
import type { StatsInterval } from '@/lib/types';
import type { CategoryId } from '@/routes/overview/category-config';
import '@/styles/overview.scss';

type Props = {
	onNavigateToActivity?: ( categoryFilter: CategoryId ) => void;
	onNavigateToAccount?: () => void;
};

/**
 * Top-level Overview-tab component.
 *
 * @param props - The component props.
 * @return The rendered Overview tab.
 */
export function OverviewTab( props: Props ): JSX.Element {
	const { onNavigateToActivity, onNavigateToAccount } = props;
	const [ interval, setIntervalValue ] = useState< StatsInterval >( '30-days' );
	const { data: apiKey, isLoading } = useApiKey();

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! apiKey?.valid ) {
		return <OverviewEmptyState onGoToAccount={ onNavigateToAccount ?? ( () => {} ) } />;
	}

	return (
		<div className="akismet-overview">
			<header className="akismet-overview__header">
				<IntervalSelector value={ interval } onChange={ setIntervalValue } />
			</header>
			<ThreatKPIs interval={ interval } />
			<CategoryGrid interval={ interval } onDrillDown={ id => onNavigateToActivity?.( id ) } />
			<WooCommercePanel interval={ interval } />
		</div>
	);
}
