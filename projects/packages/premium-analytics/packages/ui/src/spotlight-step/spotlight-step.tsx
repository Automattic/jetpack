import { Button, Popover, Stack, Text } from '@jetpack-premium-analytics/externals';
import { createPortal } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from 'react';
import styles from './spotlight-step.module.scss';

/** How the reader left the tour: Escape, or the skip control. */
export type SpotlightDismissReason = 'escape' | 'close';

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

	/** The reader leaves the tour, and how. */
	onDismiss: ( reason: SpotlightDismissReason ) => void;

	/** Which side of the anchor the card sits on. */
	side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
};

// One above the overlay: without a @wordpress/ui overlay slot, the card lands
// in the body beside it. Level with wp-admin's bar.
const STACK_LEVEL = 99999;

// Room the halo leaves around the anchor.
const HALO_PADDING = 4;

type OpenChangeDetails = {
	reason?: string;
};

// Base UI names the cause on `onOpenChange`; the overlay swallows outside presses.
const DISMISS_REASONS: Record< string, SpotlightDismissReason > = {
	'escape-key': 'escape',
	'close-press': 'close',
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

		// jsdom has no scrollIntoView.
		if ( typeof anchor.scrollIntoView === 'function' ) {
			anchor.scrollIntoView( { block: 'nearest' } );
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
 * tour and the way forward. Escape and the skip control, shown on focus, leave
 * the tour; clicks on the dimmed page do nothing.
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
	const nextRef = useRef< HTMLButtonElement >( null );

	const handleOpenChange = useCallback(
		( open: boolean, details?: OpenChangeDetails ) => {
			const reason = DISMISS_REASONS[ details?.reason ?? '' ];
			if ( ! open && reason ) {
				onDismiss( reason );
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
			{ /* Portaled to the body: inside the admin page, itself a stacking
			     context, no z-index could lift the dim over wp-admin's menu. */ }
			{ createPortal(
				<div className={ styles.overlay } aria-hidden="true">
					{ rect && (
						<div
							className={ styles.halo }
							style={ haloStyle( rect ) }
							data-testid="spotlight-halo"
						/>
					) }
				</div>,
				document.body
			) }
			<Popover.Root open modal="trap-focus" onOpenChange={ handleOpenChange }>
				<Popover.Popup
					className={ styles.card }
					initialFocus={ nextRef }
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
							<Stack direction="row" align="center" gap="sm">
								{ /* The Close part is what makes Base UI trap focus. It stays out
								     of sight until focused, as the design draws no skip control. */ }
								<Popover.Close
									className={ styles.skip }
									render={ <Button variant="minimal" tone="neutral" /> }
								>
									{ __( 'Skip tour', 'jetpack-premium-analytics-pkg' ) }
								</Popover.Close>
								<Button ref={ nextRef } variant="solid" onClick={ onNext }>
									{ isLast
										? __( 'Finish', 'jetpack-premium-analytics-pkg' )
										: __( 'Continue', 'jetpack-premium-analytics-pkg' ) }
								</Button>
							</Stack>
						</Stack>
					</Stack>
				</Popover.Popup>
			</Popover.Root>
		</>
	);
}
