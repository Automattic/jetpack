import { useCallback } from '@wordpress/element';
import { Icon, arrowUp, arrowDown } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import type { KpiSummary } from '../../types/stats';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';

type Props = {
	label: string;
	value: ReactNode;
	summary: KpiSummary;
	isLoading: boolean;
	isActive: boolean;
	onSelect: () => void;
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
 * Used in the Overview KPI row (Views, Visitors, Watch time). The card
 * acts as a tab — clicking it changes the active metric on the Views
 * trends chart. Visual treatment for the active state lands in Phase 5
 * UI work; for now `aria-pressed` carries the semantic.
 *
 * The delta indicator is a custom span (the `@wordpress/ui` Badge
 * `intent` vocabulary doesn't include success / error semantics —
 * `low / medium / high / …` is a different axis).
 *
 * @param props           - Component props.
 * @param props.label     - Uppercase label, e.g. "VIEWS".
 * @param props.value     - Pre-formatted value, e.g. "789" or "1.1 h".
 * @param props.summary   - Current + previous-period totals.
 * @param props.isLoading - When true, value is replaced by an em dash and the badge is hidden.
 * @param props.isActive  - True when this card represents the active chart metric.
 * @param props.onSelect  - Called when the card is activated (click or Enter / Space).
 * @return The card element.
 */
export default function KpiCard( {
	label,
	value,
	summary,
	isLoading,
	isActive,
	onSelect,
}: Props ): ReactElement {
	const delta = isLoading ? null : deltaPercent( summary );
	let direction: 'up' | 'down' | null = null;
	if ( delta !== null ) {
		direction = delta >= 0 ? 'up' : 'down';
	}

	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				onSelect();
			}
		},
		[ onSelect ]
	);

	return (
		<Card.Root
			role="button"
			tabIndex={ 0 }
			aria-pressed={ isActive }
			onClick={ onSelect }
			onKeyDown={ onKeyDown }
		>
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
