import { Icon, arrowUp, arrowDown } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import type { KpiSummary } from '../../types/stats';
import type { ReactElement, ReactNode } from 'react';

type Props = {
	label: string;
	value: ReactNode;
	summary: KpiSummary;
	isLoading: boolean;
};

/**
 * Computes the integer-percent change between current and previous
 * windows. Returns null when the previous window had zero, since the
 * delta is undefined and the design hides the badge in that case.
 *
 * @param summary - Current and previous-period totals.
 * @return Signed integer percent, or null.
 */
function deltaPercent( summary: KpiSummary ): number | null {
	if ( ! summary.previousPeriod ) {
		return null;
	}
	return Math.round(
		( ( summary.current - summary.previousPeriod ) / summary.previousPeriod ) * 100
	);
}

/**
 * One stat card: caps label + large value + signed delta indicator.
 * Used in the Overview KPI row (Views, Visitors, Watch time). The delta
 * indicator is a custom span (the `@wordpress/ui` Badge `intent`
 * vocabulary doesn't include success / error semantics — `low / medium
 * / high / …` is a different axis).
 *
 * @param props           - Component props.
 * @param props.label     - Uppercase label, e.g. "VIEWS".
 * @param props.value     - Pre-formatted value, e.g. "789" or "1.1 h".
 * @param props.summary   - Current + previous-period totals.
 * @param props.isLoading - When true, value is replaced by an em dash and the badge is hidden.
 * @return The card element.
 */
export default function KpiCard( { label, value, summary, isLoading }: Props ): ReactElement {
	const delta = isLoading ? null : deltaPercent( summary );
	let direction: 'up' | 'down' | null = null;
	if ( delta !== null ) {
		direction = delta >= 0 ? 'up' : 'down';
	}

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="xs">
					<Text variant="body-sm" className="vp-overview__kpi-label">
						{ label }
					</Text>
					<Text variant="heading-2xl" className="vp-overview__kpi-value">
						{ isLoading ? '—' : value }
					</Text>
					{ delta !== null && (
						<span className={ `vp-overview__kpi-delta vp-overview__kpi-delta--${ direction }` }>
							<Icon icon={ direction === 'up' ? arrowUp : arrowDown } size={ 16 } />
							{ Math.abs( delta ) }%
						</span>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
