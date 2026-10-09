/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { OnboardingTourStep } from './onboarding-tour';

export type OnboardingTourAnchors = {
	/** The first widget of the section, the traffic summary. */
	firstWidget: Element | null;

	/** The section header's date controls. */
	dateControls: Element | null;

	/** The page options menu trigger: Customize, feedback and the way back to classic Stats. */
	optionsMenu: Element | null;
};

export type OnboardingTourOptions = {
	/** Whether the reader may send feedback, which the last step introduces. */
	withFeedback: boolean;
};

/**
 * The four steps of the tour, in order, over the elements the dashboard
 * stage hands in. The last two share the page options menu.
 *
 * @param anchors              - The elements each step highlights, or null while unmounted.
 * @param options              - Tour options.
 * @param options.withFeedback - Whether to include the feedback step.
 * @return The tour steps.
 */
export function onboardingTourSteps(
	anchors: OnboardingTourAnchors,
	{ withFeedback }: OnboardingTourOptions = { withFeedback: true }
): OnboardingTourStep[] {
	const steps: OnboardingTourStep[] = [
		{
			anchor: anchors.firstWidget,
			title: __( 'Everything is a widget', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Each block of data is a widget you can move and resize to suit how you read your site.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'top',
		},
		{
			anchor: anchors.dateControls,
			title: __( 'A better date picker', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Pick any period and compare it with the one before it.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
		{
			anchor: anchors.optionsMenu,
			title: __( 'Rearrange it your way', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Select Customize in this menu to move and resize widgets. Your layout is saved to your profile.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
	];

	if ( ! withFeedback ) {
		return steps;
	}

	return [
		...steps,
		{
			anchor: anchors.optionsMenu,
			title: __( 'One last thing', 'jetpack-premium-analytics-pkg' ),
			description: __(
				"This menu is where you can share feedback and switch the preview off if you want. It's an early version, so do tell us what's working and what isn't.",
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
	];
}
