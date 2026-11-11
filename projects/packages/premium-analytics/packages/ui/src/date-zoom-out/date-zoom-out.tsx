/**
 * External dependencies
 */
import {
	getPresetLabel,
	type DateRange,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { Button, Tooltip } from '@jetpack-premium-analytics/externals';
import { formatDateRangeNatural } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';
import { levelUp } from '@wordpress/icons';
import clsx from 'clsx';

import './date-zoom-out.scss';

/** The window the control zooms back out to, and the zoom. */
export type ZoomOutTarget = {
	/** The preset naming the window, or `custom` for a hand-picked one. */
	presetId: PrimaryPresetId;
	range: DateRange;
	onZoomOut: () => void;
};

type DateZoomOutProps = ZoomOutTarget & {
	/** Greys the control out but keeps it focusable: a passing state, not a missing control. */
	disabled?: boolean;
};

/**
 * Zooms back out to the window a widget zoomed in from, by the name it has there.
 *
 * Rendered only while there is such a window: unlike the arrows beside it, most
 * of the time there is nowhere to zoom out to, and a control for that would be noise.
 *
 * @param props           - Component props.
 * @param props.presetId  - The preset naming the window, or `custom`.
 * @param props.range     - The window.
 * @param props.disabled  - Greys the control out but keeps it focusable.
 * @param props.onZoomOut - The zoom.
 * @return The control.
 */
export function DateZoomOut( { presetId, range, disabled = false, onZoomOut }: DateZoomOutProps ) {
	const label = sprintf(
		/* translators: %s: the period zoomed out to, e.g. "Last 30 days" or "Sep 1 – Sep 30, 2026". */
		__( 'Zoom out to %s', 'jetpack-premium-analytics-pkg' ),
		getPresetLabel( presetId ) ?? formatDateRangeNatural( range )
	);

	return (
		<div className={ clsx( 'date-zoom-out', { 'is-disabled': disabled } ) }>
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Button
							className="date-zoom-out__button"
							variant="minimal"
							tone="neutral"
							size="small"
							aria-label={ label }
							disabled={ disabled }
							onClick={ onZoomOut }
						>
							<Button.Icon icon={ levelUp } />
						</Button>
					}
				/>
				<Tooltip.Popup>{ label }</Tooltip.Popup>
			</Tooltip.Root>
		</div>
	);
}
