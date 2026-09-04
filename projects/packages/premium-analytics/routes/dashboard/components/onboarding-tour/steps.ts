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

	/** The configurations menu trigger among the dashboard actions (WOOA7S-2055). */
	optionsMenu: Element | null;
};

/**
 * The four steps of the tour, in order, over the elements the dashboard
 * stage hands in. The last two share the configurations menu.
 *
 * @param anchors - The elements each step highlights, or null while unmounted.
 * @return The tour steps.
 */
export function onboardingTourSteps( anchors: OnboardingTourAnchors ): OnboardingTourStep[] {
	return [
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
				"Compare any period with the one before it, and change the chart interval to suit the range you're looking at.",
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
		{
			anchor: anchors.optionsMenu,
			title: __( 'Rearrange it your way', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Access the settings here and select Customize to move and resize widgets. Your layout is saved to your profile.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
		{
			anchor: anchors.optionsMenu,
			title: __( 'One last thing', 'jetpack-premium-analytics-pkg' ),
			description: __(
				"This same menu is where you'll be able to share feedback and deactivate this tab if you want. It's an early version, so do tell us what's working and what isn't.",
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
	];
}
