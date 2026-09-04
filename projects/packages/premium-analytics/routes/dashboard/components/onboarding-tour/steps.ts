/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { OnboardingTourStep } from './onboarding-tour';

export type OnboardingTourAnchors = {
	/** The dashboard actions: Customize today, the configurations menu once it lands. */
	actions: Element | null;

	/** The section header's date controls. */
	dateControls: Element | null;

	/** The first widget of the section. */
	firstWidget: Element | null;
};

/**
 * The three steps of the tour, in order, over the elements the dashboard
 * stage hands in. Copy is the design's proposal.
 *
 * @param anchors - The elements each step highlights, or null while unmounted.
 * @return The tour steps.
 */
export function onboardingTourSteps( anchors: OnboardingTourAnchors ): OnboardingTourStep[] {
	return [
		{
			anchor: anchors.actions,
			title: __( 'Customize your experience', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Access customization from this menu. Move and resize widgets to prioritize what you need.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
		{
			anchor: anchors.dateControls,
			title: __( 'Improved date selection', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'Simplified and more powerful. You can now compare your data with past periods and adjust your chart intervals.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'bottom',
		},
		{
			anchor: anchors.firstWidget,
			title: __( 'Introducing widgets', 'jetpack-premium-analytics-pkg' ),
			description: __(
				'All data is delivered using powerful and versatile widgets for better visualization.',
				'jetpack-premium-analytics-pkg'
			),
			side: 'top',
		},
	];
}
