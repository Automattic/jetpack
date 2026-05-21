import { Sparkline } from '@automattic/charts';
import '@automattic/charts/style.css';
import { JETPACK_GREEN, MOCK_SUBSCRIBER_TREND } from '../constants';
import styles from '../style.module.css';

const CHART_ID = 'jetpack-newsletter-subscribers-trend';

/**
 * Decorative upward trend line behind the subscriber count.
 *
 * @return Background sparkline chart.
 */
export default function SubscriberTrendBackground(): JSX.Element {
	return (
		<div className={ styles.chartBackground } aria-hidden="true">
			<Sparkline
				className={ styles.chart }
				chartId={ CHART_ID }
				data={ MOCK_SUBSCRIBER_TREND }
				color={ JETPACK_GREEN }
				strokeWidth={ 2 }
				withGradientFill
				gradient={ {
					from: JETPACK_GREEN,
					to: 'transparent',
					fromOpacity: 0.2,
					toOpacity: 0,
				} }
				margin={ { top: 4, right: 4, bottom: 4, left: 4 } }
			/>
		</div>
	);
}
