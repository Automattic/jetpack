import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
import './style.scss';
import type { ReactElement } from 'react';

type Props = {
	panelId: string;
	activeTabId: string;
};

/**
 * Tabpanel shown when the Retention KPI is the active metric. WPCOM
 * exposes retention only as a per-day scalar (`retention_rate`), never
 * as a time series or curve, so there is nothing for the trends chart
 * to plot — this quiet state explains that instead of rendering an
 * empty chart. It reuses the chart panel's `panelId`, keeping the KPI
 * tabs' `aria-controls` wiring valid for all four tabs.
 *
 * @param props             - Component props.
 * @param props.panelId     - Stable DOM id shared with the chart card; KPI tabs reference it via `aria-controls`.
 * @param props.activeTabId - Id of the Retention KPI tab; sets the panel's `aria-labelledby`.
 * @return The card element.
 */
export default function RetentionPanel( { panelId, activeTabId }: Props ): ReactElement {
	return (
		<Card.Root id={ panelId } role="tabpanel" aria-labelledby={ activeTabId } tabIndex={ 0 }>
			<Card.Header>
				<Card.Title>{ __( 'Retention', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<div className="vp-video-analytics__panel-empty">
					<Text>
						{ __(
							'Retention has no time series. The retention card above shows the views-weighted average of each day’s retention rate for the selected period.',
							'jetpack-videopress-pkg'
						) }
					</Text>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
