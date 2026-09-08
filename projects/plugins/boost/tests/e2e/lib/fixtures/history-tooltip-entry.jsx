/* global document */
import '@wordpress/theme/design-tokens.css';
import { createRoot } from 'react-dom/client';
import HistoryChartCard from '../../../../_inc/overview/history-chart-card';
import '../../../../_inc/overview/overview.scss';
import '../../../../../../packages/my-jetpack/_inc/components/stats-section/stats-chart-tooltip.module.scss';

const startDate = Date.UTC( 2026, 8, 1 );
const day = 24 * 60 * 60 * 1000;
const data = {
	startDate,
	endDate: startDate + 6 * day,
	periods: Array.from( { length: 7 }, ( _, index ) => ( {
		timestamp: startDate + index * day,
		dimensions: {
			desktop_overall_score: 80 + index,
			mobile_overall_score: 65 + index,
			desktop_lcp: 1.2,
			mobile_lcp: 2.1,
			desktop_tbt: 0.1,
			mobile_tbt: 0.3,
			desktop_cls: 0.01,
			mobile_cls: 0.04,
		},
	} ) ),
	annotations: [
		{ timestamp: startDate + 3 * day, text: 'Optimization enabled' },
		{ timestamp: startDate + 4 * day, text: 'Configuration updated' },
	],
};

const noop = () => {};

createRoot( document.getElementById( 'root' ) ).render(
	<div className="jetpack-boost-overview">
		<HistoryChartCard data={ data } onRetry={ noop } onDismissFreshStart={ noop } />
	</div>
);
