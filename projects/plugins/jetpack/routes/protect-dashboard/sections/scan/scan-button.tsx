import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useId, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Popover, Stack, VisuallyHidden } from '@wordpress/ui';
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
	if ( ! lastChecked ) {
		return null;
	}
	const next = new Date( new Date( lastChecked.replace( ' ', 'T' ) + 'Z' ).getTime() + DAY_IN_MS );
	return Number.isNaN( next.getTime() ) ? null : next;
}

/**
 * Whether a time has passed, re-rendering when it does.
 *
 * @param time - The time, or null when unknown.
 * @return True once the time has passed, or when it is unknown.
 */
export function useHasPassed( time: Date | null ): boolean {
	const [ now, setNow ] = useState( Date.now );
	const target = time ? time.getTime() : null;

	useEffect( () => {
		if ( target === null || target <= now ) {
			return;
		}
		const timer = setTimeout(
			() => setNow( Date.now() ),
			Math.max( 0, target - Date.now() ) + 1000
		);
		return () => clearTimeout( timer );
	}, [ target, now ] );

	return target === null || target <= now;
}

type Props = {
	scan: ScanState;
	isStarting: boolean;
	onScan: () => void;
	label: string;
	variant?: ComponentProps< typeof Button >[ 'variant' ];
	size?: ComponentProps< typeof Button >[ 'size' ];
};

/**
 * Starts a scan when one can actually run, otherwise explains when it can.
 *
 * @param props            - Component props.
 * @param props.scan       - The current report.
 * @param props.isStarting - Whether a scan is being requested.
 * @param props.onScan     - Starts a scan.
 * @param props.label      - The button text.
 * @param props.variant    - The button variant.
 * @param props.size       - The button size.
 * @return The button.
 */
export default function ScanButton( { scan, isStarting, onScan, label, variant, size }: Props ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );
	const descriptionId = useId();
	const nextCheck = getNextCheck( scan.lastChecked );
	const hasNextCheckPassed = useHasPassed( nextCheck );
	const canScan = scan.hasPlan || hasNextCheckPassed;

	const button = (
		<Button
			variant={ variant }
			size={ size }
			onClick={ onScan }
			loading={ isStarting }
			disabled={ isStarting || ! canScan }
			aria-describedby={ canScan ? undefined : descriptionId }
		>
			{ label }
		</Button>
	);

	if ( canScan ) {
		return button;
	}

	const description = sprintf(
		/* translators: %s is a date and time, such as "Oct 6, 10PM". */
		__(
			'Free vulnerability checks run once a day, so the next one can start on %s. Upgrade to Scan to scan whenever you like.',
			'jetpack'
		),
		dateI18n( 'M j, gA', nextCheck )
	);

	return (
		<Popover.Root open={ isOpen } onOpenChange={ setIsOpen }>
			{ /* A disabled `@wordpress/ui` Button stays focusable; opening on focus covers keyboard users. */ }
			<Popover.Trigger
				openOnHover
				delay={ 0 }
				closeDelay={ 0 }
				nativeButton={ false }
				render={ <span className="jp-protect-scan-button" onFocus={ open } onBlur={ close } /> }
			>
				{ button }
				<VisuallyHidden id={ descriptionId }>{ description }</VisuallyHidden>
			</Popover.Trigger>
			<Popover.Popup className="jp-protect-scan-button__popover" initialFocus={ false }>
				<Stack direction="column" gap="xs">
					<Popover.Title>{ __( 'Checked once a day', 'jetpack' ) }</Popover.Title>
					<Popover.Description>{ description }</Popover.Description>
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
