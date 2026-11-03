/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { OnboardingTourStep } from './onboarding-tour';
import type { OnboardingWelcomeVariant } from '@jetpack-premium-analytics/ui';

export type OnboardingTourAnchors = {
	/** The first widget of the section, the traffic summary. */
	firstWidget: Element | null;

	/** The section header's date controls. */
	dateControls: Element | null;

	/** The page options menu trigger: Customize, feedback and the way back to classic Stats. */
	optionsMenu: Element | null;

	/** The section tab bar. */
	sectionTabs: Element | null;
};

export type OnboardingTourOptions = {
	/** Whether the reader may send feedback, which the last step introduces. */
	withFeedback: boolean;

	/** The journey the tour belongs to. Defaults to the new Stats alone. */
	flow?: OnboardingWelcomeVariant;

	/** Whether the reader can arrange the section, which a plan can rule out. Defaults to true. */
	withCustomize?: boolean;

	/** Whether the date controls offer a comparison; a free site's last 7 days do not. Defaults to true. */
	withComparison?: boolean;
};

/**
 * The tour steps of a journey, in order, over the elements the dashboard
 * stage hands in. The WooCommerce tab adds a step on the tab bar, which is all
 * a reader who already knows the new Stats is shown.
 *
 * @param anchors                - The elements each step highlights, or null while unmounted.
 * @param options                - Tour options.
 * @param options.withFeedback   - Whether to include the feedback step.
 * @param options.flow           - The journey the tour belongs to.
 * @param options.withCustomize  - Whether to include the steps about arranging widgets.
 * @param options.withComparison - Whether the date step mentions comparing periods.
 * @return The tour steps.
 */
export function onboardingTourSteps(
	anchors: OnboardingTourAnchors,
	{
		withFeedback,
		flow = 'stats',
		withCustomize = true,
		withComparison = true,
	}: OnboardingTourOptions = {
		withFeedback: true,
	}
): OnboardingTourStep[] {
	const tabsStep: OnboardingTourStep = {
		anchor: anchors.sectionTabs,
		title: __( 'Switch between boards', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Access your different store and traffic boards from these tabs.',
			'jetpack-premium-analytics-pkg'
		),
		side: 'bottom',
	};

	if ( flow === 'store' ) {
		return [ tabsStep ];
	}

	const widgetStep: OnboardingTourStep = {
		anchor: anchors.firstWidget,
		title: __( 'Everything is a widget', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Each block of data is a widget you can move and resize to suit how you read your site.',
			'jetpack-premium-analytics-pkg'
		),
		side: 'top',
	};
	const arrangeStep: OnboardingTourStep = {
		anchor: anchors.optionsMenu,
		title: __( 'Rearrange it your way', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Select Customize in this menu to move and resize widgets. Your layout is saved to your profile.',
			'jetpack-premium-analytics-pkg'
		),
		side: 'bottom',
	};

	const steps: OnboardingTourStep[] = [
		...( withCustomize ? [ widgetStep ] : [] ),
		...( flow === 'stats-and-store' ? [ tabsStep ] : [] ),
		{
			anchor: anchors.dateControls,
			title: __( 'A better date picker', 'jetpack-premium-analytics-pkg' ),
			description: withComparison
				? __(
						'Pick any period and compare it with the one before it.',
						'jetpack-premium-analytics-pkg'
					)
				: __(
						'See how your site did on any day of the last 7 days.',
						'jetpack-premium-analytics-pkg'
					),
			side: 'bottom',
		},
		...( withCustomize ? [ arrangeStep ] : [] ),
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
