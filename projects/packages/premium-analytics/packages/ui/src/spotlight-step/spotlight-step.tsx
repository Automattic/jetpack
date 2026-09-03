import { Button, Popover, Stack, Text } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './spotlight-step.module.scss';

export type SpotlightStepProps = {
	/** The element to spotlight. Until it is mounted the step renders nothing. */
	anchor: Element | null;

	title: ReactNode;

	description: ReactNode;

	/** One-based position in the tour, for the "n of m" counter. */
	step: number;

	totalSteps: number;

	/** Continue, or Finish on the last step. */
	onNext: () => void;

	/** Escape: the reader leaves the tour. */
	onDismiss: () => void;

	/** Which side of the anchor the card sits on. */
	side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
};

// Level with wp-admin's bar and above its menu, the way the widget inserter stacks.
const STACK_LEVEL = 99999;

// Room the halo leaves around the anchor.
const HALO_PADDING = 4;

type OpenChangeDetails = {
	reason?: string;
};

/**
 * The anchor's viewport box, followed through resizes and scrolling.
 *
 * @param anchor - The element to follow.
 * @return Its bounding box, or null without an anchor.
 */
function useAnchorRect( anchor: Element | null ): DOMRect | null {
	const [ rect, setRect ] = useState< DOMRect | null >( null );

	useLayoutEffect( () => {
		if ( ! anchor ) {
			setRect( null );
			return undefined;
		}

		const update = () => setRect( anchor.getBoundingClientRect() );
		update();

		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver( update );
		observer?.observe( anchor );
		window.addEventListener( 'scroll', update, true );
		window.addEventListener( 'resize', update );

		return () => {
			observer?.disconnect();
			window.removeEventListener( 'scroll', update, true );
			window.removeEventListener( 'resize', update );
		};
	}, [ anchor ] );

	return rect;
}

function haloStyle( rect: DOMRect ): CSSProperties {
	return {
		top: rect.top - HALO_PADDING,
		left: rect.left - HALO_PADDING,
		width: rect.width + HALO_PADDING * 2,
		height: rect.height + HALO_PADDING * 2,
	};
}

/**
 * One step of a spotlight tour: the page dims except for a halo around the
 * anchor, and a card beside it carries the step's copy, its position in the
 * tour and the way forward. Escape leaves the tour; clicks on the dimmed page
 * do nothing.
 */
export function SpotlightStep( {
	anchor,
	title,
	description,
	step,
	totalSteps,
	onNext,
	onDismiss,
	side = 'bottom',
}: SpotlightStepProps ) {
	const rect = useAnchorRect( anchor );

	// The overlay swallows outside presses, so the only close reaching here is Escape.
	const handleOpenChange = useCallback(
		( open: boolean, details?: OpenChangeDetails ) => {
			if ( ! open && details?.reason === 'escape-key' ) {
				onDismiss();
			}
		},
		[ onDismiss ]
	);

	if ( ! anchor ) {
		return null;
	}

	const isLast = step >= totalSteps;

	return (
		<>
			<div className={ styles.overlay } aria-hidden="true">
				{ rect && (
					<div className={ styles.halo } style={ haloStyle( rect ) } data-testid="spotlight-halo" />
				) }
			</div>
			<Popover.Root open modal="trap-focus" onOpenChange={ handleOpenChange }>
				<Popover.Popup
					className={ styles.card }
					portal={
						<Popover.Portal style={ { '--wp-ui-popover-z-index': STACK_LEVEL } as CSSProperties } />
					}
					positioner={ <Popover.Positioner anchor={ anchor } side={ side } sideOffset={ 12 } /> }
				>
					<Stack direction="column" gap="sm">
						<Popover.Title>{ title }</Popover.Title>
						<Popover.Description>{ description }</Popover.Description>
						<Stack direction="row" align="center" justify="space-between" gap="md">
							<Text variant="body-sm">
								{ sprintf(
									/* translators: 1: the current step number, 2: the number of steps in the tour. */
									__( '%1$d of %2$d', 'jetpack-premium-analytics-pkg' ),
									step,
									totalSteps
								) }
							</Text>
							<Button variant="solid" onClick={ onNext }>
								{ isLast
									? __( 'Finish', 'jetpack-premium-analytics-pkg' )
									: __( 'Continue', 'jetpack-premium-analytics-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				</Popover.Popup>
			</Popover.Root>
		</>
	);
}
