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
	id: string;
	controlsId: string;
};

// Keys that move focus across sibling tabs in the same tablist, per the
// WAI-ARIA tabs pattern. Selection happens on Enter / Space / click,
// not on focus move (manual activation, since the chart re-render is
// observable to the user).
const FOCUS_KEYS: Record< string, 'first' | 'last' | 'next' | 'prev' | undefined > = {
	ArrowLeft: 'prev',
	ArrowRight: 'next',
	Home: 'first',
	End: 'last',
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
 * Used in the Overview KPI row (Views, Impressions, Watch time) where the
 * three cards form a WAI-ARIA tablist that selects the active metric on
 * the Views trends chart. Click / Enter / Space activates; arrow keys
 * move focus between siblings without selecting.
 *
 * The delta indicator is a custom span (the `@wordpress/ui` Badge
 * `intent` vocabulary doesn't include success / error semantics —
 * `low / medium / high / …` is a different axis).
 *
 * @param props            - Component props.
 * @param props.label      - Uppercase label, e.g. "VIEWS".
 * @param props.value      - Pre-formatted value, e.g. "789" or "1.1 h".
 * @param props.summary    - Current + previous-period totals.
 * @param props.isLoading  - When true, value is replaced by an em dash and the badge is hidden.
 * @param props.isActive   - True when this card represents the active chart metric.
 * @param props.onSelect   - Called when the card is activated (click or Enter / Space).
 * @param props.id         - Stable DOM id used by the chart's `aria-labelledby`.
 * @param props.controlsId - Id of the tabpanel (chart card) this tab controls.
 * @return The card element.
 */
export default function KpiCard( {
	label,
	value,
	summary,
	isLoading,
	isActive,
	onSelect,
	id,
	controlsId,
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
				return;
			}
			const move = FOCUS_KEYS[ event.key ];
			if ( ! move ) {
				return;
			}
			const tablist = event.currentTarget.closest( '[role="tablist"]' );
			if ( ! tablist ) {
				return;
			}
			const tabs = Array.from( tablist.querySelectorAll< HTMLElement >( '[role="tab"]' ) );
			const currentIndex = tabs.indexOf( event.currentTarget );
			if ( currentIndex < 0 ) {
				return;
			}
			let nextIndex: number;
			if ( move === 'first' ) {
				nextIndex = 0;
			} else if ( move === 'last' ) {
				nextIndex = tabs.length - 1;
			} else if ( move === 'next' ) {
				nextIndex = ( currentIndex + 1 ) % tabs.length;
			} else {
				nextIndex = ( currentIndex - 1 + tabs.length ) % tabs.length;
			}
			event.preventDefault();
			tabs[ nextIndex ]?.focus();
		},
		[ onSelect ]
	);

	return (
		<Card.Root
			id={ id }
			role="tab"
			tabIndex={ isActive ? 0 : -1 }
			aria-selected={ isActive }
			aria-controls={ controlsId }
			onClick={ onSelect }
			onKeyDown={ onKeyDown }
		>
			<Card.Content>
				<Stack direction="column" gap="xs">
					<Text variant="body-sm" className="vp-overview__kpi-label">
						{ label }
					</Text>
					{ isLoading ? (
						<span
							className="vp-overview__skeleton-block vp-overview__skeleton-block--kpi-value"
							aria-hidden="true"
						/>
					) : (
						<Text variant="heading-2xl" className="vp-overview__kpi-value">
							{ value }
						</Text>
					) }
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
