/**
 * External dependencies
 */
import { SpotlightStep, type SpotlightStepProps } from '@jetpack-premium-analytics/ui';
import { useEffect, useRef } from 'react';

export type OnboardingTourStep = Pick<
	SpotlightStepProps,
	'anchor' | 'title' | 'description' | 'side'
>;

type OnboardingTourProps = {
	/** The steps in order; the hook owns which one is current. */
	steps: OnboardingTourStep[];

	/** Zero-based index of the current step. */
	current: number;

	onNext: () => void;

	onDismiss: SpotlightStepProps[ 'onDismiss' ];
};

/**
 * Renders the current step of the onboarding tour over its anchor. A step
 * whose anchor is not on this surface is skipped rather than left invisible,
 * so the tour never stalls on a control the section does not show.
 *
 * @param props           - Component props.
 * @param props.steps     - The tour steps in order.
 * @param props.current   - Zero-based index of the current step.
 * @param props.onNext    - Advances the tour, or finishes it on the last step.
 * @param props.onDismiss - Leaves the tour, and how.
 * @return The current step, or nothing while it has no anchor.
 */
export function OnboardingTour( { steps, current, onNext, onDismiss }: OnboardingTourProps ) {
	const step = steps[ current ];
	const anchor = step?.anchor ?? null;

	// Skip a step at most once: the parent re-renders before it moves on, and a
	// second call would advance past the next step too.
	const skippedRef = useRef< number | null >( null );
	useEffect( () => {
		if ( step && ! anchor && skippedRef.current !== current ) {
			skippedRef.current = current;
			onNext();
		}
	}, [ step, anchor, current, onNext ] );

	if ( ! step || ! anchor ) {
		return null;
	}

	return (
		<SpotlightStep
			anchor={ anchor }
			title={ step.title }
			description={ step.description }
			side={ step.side }
			step={ current + 1 }
			totalSteps={ steps.length }
			onNext={ onNext }
			onDismiss={ onDismiss }
		/>
	);
}
