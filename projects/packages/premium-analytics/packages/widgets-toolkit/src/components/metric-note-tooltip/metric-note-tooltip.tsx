/**
 * External dependencies
 */
import { Tooltip, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './metric-note-tooltip.module.scss';
import type { ReactNode } from 'react';

export type MetricNoteTooltipProps = {
	/**
	 * Caveat about how the metric is aggregated. Without one, the children render in a plain `div`.
	 */
	note?: string;

	className?: string;

	children: ReactNode;
};

/**
 * Shows a metric's note in a tooltip on hover and keyboard focus, and reads it once to assistive tech.
 *
 * @param {MetricNoteTooltipProps} props - The component props.
 * @return The rendered box.
 */
export function MetricNoteTooltip( { note, className, children }: MetricNoteTooltipProps ) {
	if ( ! note ) {
		return <div className={ className }>{ children }</div>;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={ <div className={ clsx( styles.trigger, className ) } tabIndex={ 0 } /> }
			>
				{ children }
				<VisuallyHidden>{ note }</VisuallyHidden>
			</Tooltip.Trigger>
			{ /* Assistive tech reads the copy in the trigger, so the popup is hidden, and
			     drops the `tabIndex={-1}` Base UI gives it so nothing hidden can take focus. */ }
			<Tooltip.Popup aria-hidden="true" tabIndex={ undefined } data-testid="metric-note-tooltip">
				{ note }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}
