/**
 * External dependencies
 */
import { SpotlightStep, type SpotlightStepProps } from '@jetpack-premium-analytics/ui';

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
 * Renders the current step of the onboarding tour over its anchor. The stage
 * hands in only the steps whose anchors are on the page.
 *
 * @param props           - Component props.
 * @param props.steps     - The tour steps in order.
 * @param props.current   - Zero-based index of the current step.
 * @param props.onNext    - Advances the tour, or finishes it on the last step.
 * @param props.onDismiss - Leaves the tour, and how.
 * @return The current step, or nothing past the last one.
 */
export function OnboardingTour( { steps, current, onNext, onDismiss }: OnboardingTourProps ) {
	const step = steps[ current ];

	if ( ! step?.anchor ) {
		return null;
	}

	return (
		<SpotlightStep
			anchor={ step.anchor }
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
