import { Button, Dialog, Stack } from '@jetpack-premium-analytics/externals';
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WidgetGridAnimation } from '../widget-grid-animation';
import styles from './onboarding-welcome-modal.module.scss';
import { StoreIllustration } from './store-illustration';
import type { ReactNode } from 'react';

/** How the reader closed the modal without starting: the close button or Escape. */
export type OnboardingDismissReason = 'close' | 'escape' | 'other';

/**
 * Which journey the modal introduces: the new Stats, the WooCommerce tab to a
 * reader who already knows the new Stats, or both at once.
 */
export type OnboardingWelcomeVariant = 'stats' | 'store' | 'stats-and-store';

// Base UI names the cause on `onOpenChange`; these are the two a reader can produce.
const DISMISS_REASONS: Record< string, OnboardingDismissReason > = {
	'close-press': 'close',
	'escape-key': 'escape',
};

type OpenChangeDetails = {
	reason?: string;
};

type Slide = {
	illustration: ReactNode;
	title: string;
	description: string;
};

/**
 * The slides a variant shows, in order.
 *
 * @param variant - The journey the modal introduces.
 * @return The slides.
 */
function slidesFor( variant: OnboardingWelcomeVariant ): Slide[] {
	const stats: Slide = {
		illustration: <WidgetGridAnimation />,
		title: __( 'Welcome to the new Stats', 'jetpack-premium-analytics-pkg' ),
		description: __(
			"It's built from widgets you can move and resize, so the page can match how you read your site. This is an early version and we'll keep adding new tabs and features in regular updates.",
			'jetpack-premium-analytics-pkg'
		),
	};

	if ( variant === 'stats' ) {
		return [ stats ];
	}

	if ( variant === 'store' ) {
		return [
			{
				illustration: <StoreIllustration />,
				title: __( 'Your Woo analytics in one place', 'jetpack-premium-analytics-pkg' ),
				description: __(
					'Learn all about your site traffic and store performance from a single place with Analytics.',
					'jetpack-premium-analytics-pkg'
				),
			},
		];
	}

	return [
		stats,
		{
			illustration: <StoreIllustration />,
			title: __( 'Your store analytics integrated', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Learn all about your Woo store performance from a single place with Analytics.',
				'jetpack-premium-analytics-pkg'
			),
		},
	];
}

export type OnboardingWelcomeModalProps = {
	/** The consumer owns the open state; the modal only reports what the reader chose. */
	open: boolean;

	/** Which journey to introduce. Defaults to the new Stats alone. */
	variant?: OnboardingWelcomeVariant;

	/** The reader pressed the tour button on the last slide and wants the tour. */
	onStart: () => void;

	/** The reader closed the modal instead, and how. */
	onDismiss: ( reason: OnboardingDismissReason ) => void;
};

/**
 * The first step of the onboarding: a dialog that introduces the new Stats,
 * the WooCommerce tab, or both, one slide at a time, and hands off to the tour.
 */
export function OnboardingWelcomeModal( {
	open,
	variant = 'stats',
	onStart,
	onDismiss,
}: OnboardingWelcomeModalProps ) {
	const slides = useMemo( () => slidesFor( variant ), [ variant ] );
	const [ index, setIndex ] = useState( 0 );
	const slide = slides[ Math.min( index, slides.length - 1 ) ];
	const isLast = index >= slides.length - 1;

	useEffect( () => {
		if ( ! open ) {
			setIndex( 0 );
		}
	}, [ open ] );

	const position = sprintf(
		/* translators: 1: current slide number, 2: total slides. */
		__( 'Slide %1$d of %2$d', 'jetpack-premium-analytics-pkg' ),
		index + 1,
		slides.length
	);

	// Focus stays on the footer button as the slide changes, so the new slide is read out.
	const showNext = useCallback( () => {
		const next = index + 1;
		setIndex( next );
		speak(
			sprintf(
				/* translators: 1: current slide number, 2: total slides, 3: slide title. */
				__( 'Slide %1$d of %2$d: %3$s', 'jetpack-premium-analytics-pkg' ),
				next + 1,
				slides.length,
				slides[ next ]?.title ?? ''
			),
			'polite'
		);
	}, [ index, slides ] );

	// The tour button closes through its own handler, so any close reaching
	// here came from the chrome.
	const handleOpenChange = useCallback(
		( nextOpen: boolean, details?: OpenChangeDetails ) => {
			if ( ! nextOpen ) {
				onDismiss( DISMISS_REASONS[ details?.reason ?? '' ] ?? 'other' );
			}
		},
		[ onDismiss ]
	);

	// A click on the backdrop must not end the journey: the modal opens once per
	// reader, so a stray click would lose the tour for good.
	return (
		<Dialog.Root open={ open } onOpenChange={ handleOpenChange } disablePointerDismissal>
			<Dialog.Popup size="small">
				<Dialog.CloseIconButton className={ styles.close } />
				{ /* The stage lives in the scroll region so the copy and the button
				     stay reachable on short viewports; the footer stays pinned. */ }
				<Dialog.Content>
					<div className={ styles.stage }>{ slide.illustration }</div>
					<Stack direction="column" gap="md">
						{ slides.length > 1 && (
							<div className={ styles.dots } role="img" aria-label={ position }>
								{ slides.map( ( _, dot ) => (
									<span
										key={ dot }
										className={ clsx( styles.dot, dot === index && styles.dotActive ) }
									/>
								) ) }
							</div>
						) }
						<Dialog.Title>{ slide.title }</Dialog.Title>
						<Dialog.Description>{ slide.description }</Dialog.Description>
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					{ isLast ? (
						<Button variant="solid" onClick={ onStart }>
							{ __( 'Take a quick tour', 'jetpack-premium-analytics-pkg' ) }
						</Button>
					) : (
						<Button variant="solid" onClick={ showNext }>
							{ __( 'Next', 'jetpack-premium-analytics-pkg' ) }
						</Button>
					) }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
