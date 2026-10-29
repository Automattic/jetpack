import { humanTimeDiff } from '@wordpress/date';
import { useEffect, useId, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Tooltip, VisuallyHidden } from '@wordpress/ui';
import useRerenderEvery from '../../components/use-rerender-every';
import { parseLastChecked } from './store';
import type { ScanState } from './types';
import type { ComponentProps } from 'react';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * When a new daily check can run: WordPress.com rebuilds a report only once it is a day old.
 *
 * @param lastChecked - The last check, in UTC as `YYYY-MM-DD HH:MM:SS`.
 * @return The time, or null when unknown.
 */
export function getNextCheck( lastChecked?: string | null ): Date | null {
	const last = parseLastChecked( lastChecked );
	return last && new Date( last.getTime() + DAY_IN_MS );
}

/**
 * Whether a time has passed, re-rendering when it does.
 *
 * @param time   - The time, or null when unknown.
 * @param margin - How long after the time to re-render, in ms.
 * @return True once the time has passed, or when it is unknown.
 */
export function useHasPassed( time: Date | null, margin = 1000 ): boolean {
	const [ now, setNow ] = useState( Date.now );
	const target = time ? time.getTime() : null;

	useEffect( () => {
		if ( target === null || target <= now ) {
			return;
		}
		const timer = setTimeout(
			() => setNow( Date.now() ),
			Math.max( 0, target - Date.now() ) + margin
		);
		return () => clearTimeout( timer );
	}, [ target, now, margin ] );

	return target === null || target <= now;
}

type Props = {
	scan: ScanState;
	isStarting: boolean;
	onScan: () => void;
	label: string;
	variant?: ComponentProps< typeof Button >[ 'variant' ];
	size?: ComponentProps< typeof Button >[ 'size' ];
	disabled?: boolean;
	withNextCheck?: boolean;
};

/**
 * Starts a scan when one can actually run, otherwise offers the upgrade.
 *
 * @param props               - Component props.
 * @param props.scan          - The current report.
 * @param props.isStarting    - Whether a scan is being requested.
 * @param props.onScan        - Starts a scan.
 * @param props.label         - The button text.
 * @param props.variant       - The button variant.
 * @param props.size          - The button size.
 * @param props.disabled      - Disables the button, such as while a scan runs.
 * @param props.withNextCheck - Also says when the next free check can run, where no countdown shows.
 * @return The button.
 */
export default function ScanButton( {
	scan,
	isStarting,
	onScan,
	label,
	variant,
	size,
	disabled,
	withNextCheck = false,
}: Props ) {
	const descriptionId = useId();
	const nextCheck = getNextCheck( scan.lastChecked );
	const hasNextCheckPassed = useHasPassed( nextCheck );
	const canScan = scan.hasPlan || hasNextCheckPassed;
	useRerenderEvery( 30000, withNextCheck && ! canScan );

	const button = (
		<Button
			variant={ variant }
			size={ size }
			onClick={ onScan }
			loading={ isStarting }
			disabled={ disabled || isStarting || ! canScan }
			aria-describedby={ canScan ? undefined : descriptionId }
		>
			{ label }
		</Button>
	);

	if ( canScan ) {
		return button;
	}

	const description =
		withNextCheck && nextCheck
			? sprintf(
					/* translators: %s is how long until the next free check, such as "in 21 hours". */
					__( 'Next free check %s. Upgrade to Scan to check anytime.', 'jetpack-protect-pkg' ),
					humanTimeDiff( nextCheck )
				)
			: __( 'Upgrade to Scan to check anytime', 'jetpack-protect-pkg' );

	return (
		<Tooltip.Provider delay={ 0 }>
			<Tooltip.Root>
				{ /* The wrapper catches hover and focus: a disabled `@wordpress/ui` Button stays focusable. */ }
				<Tooltip.Trigger render={ <span /> }>{ button }</Tooltip.Trigger>
				<Tooltip.Popup positioner={ <Tooltip.Positioner side="bottom" /> }>
					{ description }
				</Tooltip.Popup>
			</Tooltip.Root>
			<VisuallyHidden id={ descriptionId }>{ description }</VisuallyHidden>
		</Tooltip.Provider>
	);
}
