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
 *
 * The wrapper carries `akismet-overview-wide` so it opts out of the
 * tab-panel 720px cap in app.scss — the six-card grid + WC panel
 * need the full container width.
 */
import { Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
		<div className="akismet-overview akismet-overview-wide">
			<header className="akismet-overview__header">
				<div className="akismet-overview__header-meta">
					<span className="akismet-overview__header-eyebrow">{ __( 'Overview', 'akismet' ) }</span>
					<span className="akismet-overview__header-title">
						{ __( 'Site-wide threat protection', 'akismet' ) }
					</span>
				</div>
				<IntervalSelector value={ interval } onChange={ setIntervalValue } />
			</header>
			<ThreatKPIs interval={ interval } />
			<CategoryGrid interval={ interval } onDrillDown={ id => onNavigateToActivity?.( id ) } />
			<WooCommercePanel interval={ interval } />
		</div>
	);
}
