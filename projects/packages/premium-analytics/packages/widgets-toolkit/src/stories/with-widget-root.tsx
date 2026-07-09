import { getDefaultQueryParams, normalizeReportParams } from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '../components/widget-root/widget-root';
import { registerReportMocks } from './mocks/register-report-mocks';
import type { Decorator } from '@storybook/react';

/*
 * Register the report-data `apiFetch` mock middleware as soon as this module is
 * imported. Any story using `withWidgetRoot()` therefore gets mocked report data
 * automatically, with no per-story wiring. `registerReportMocks` is idempotent.
 */
registerReportMocks();

/**
 * Storybook decorator factory that wraps a story in the real `WidgetRoot`.
 *
 * `WidgetRoot` provides everything a widget needs to render: the report-params
 * context, a `GlobalChartsProvider`, and the analytics react-query client. Use
 * this for any story whose component reads `useWidgetRootContext` (directly or
 * via `useWidgetError`) or fetches report data — wrapping in the bare context
 * provider is not enough.
 *
 * Note: there is no analytics backend in Storybook, so data-fetching widgets
 * render their loading/empty/error chrome rather than live data.
 *
 * @param reportParams - Report params to seed; pass `getDefaultQueryParams( true )` for comparison mode.
 * @return A Storybook decorator wrapping the story in `WidgetRoot`.
 */
export const withWidgetRoot =
	( reportParams = getDefaultQueryParams() ): Decorator =>
	Story => (
		<WidgetRoot attributes={ { reportParams: normalizeReportParams( reportParams ) } }>
			<Story />
		</WidgetRoot>
	);
