/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { action } from 'storybook/actions';
import type { Decorator } from '@storybook/react';

const openPeriod = action( 'openPeriod' );

/**
 * Offer the story a period to set, as the page hosting the widget does, logging each one to Actions.
 */
export const withStoryPeriodHost: Decorator = Story => (
	<ReportScopeProvider openPeriod={ openPeriod }>
		<Story />
	</ReportScopeProvider>
);
