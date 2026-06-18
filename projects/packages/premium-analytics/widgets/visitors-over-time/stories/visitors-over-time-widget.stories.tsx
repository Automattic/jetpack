import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import LineChart from '../../../../../js-packages/charts/src/charts/line-chart/line-chart';
import VisitorsOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

const VISITORS_OVER_TIME_RENDER_MODULE = 'storybook/visitors-over-time';
const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const DAY_MS = 24 * 60 * 60 * 1000;
// Static Storybook builds need this source import before ComparativeLineChart reads LineChart.Legend.
const ensureLineChartComposition = () => LineChart.Legend;

function toDayStart( date: Date ) {
	return new Date( Date.UTC( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() ) );
}

function toDayEnd( date: Date ) {
	const end = toDayStart( date );
	end.setUTCHours( 23, 59, 59, 999 );
	return end;
}

function parseDateParam( value: string | null, fallback: Date ) {
	if ( ! value ) {
		return fallback;
	}

	const date = new Date( value );
	return Number.isNaN( date.getTime() ) ? fallback : date;
}

function buildVisitorsByDateResponse( query: URLSearchParams ) {
	const fallbackTo = toDayEnd( new Date() );
	const fallbackFrom = toDayStart( new Date( fallbackTo.getTime() - 29 * DAY_MS ) );
	const from = toDayStart( parseDateParam( query.get( 'from' ), fallbackFrom ) );
	const to = toDayStart( parseDateParam( query.get( 'to' ), fallbackTo ) );
	const days = Math.max(
		1,
		Math.min( 60, Math.floor( ( to.getTime() - from.getTime() ) / DAY_MS ) + 1 )
	);
	const seed = from.getUTCDate() + from.getUTCMonth() * 7;
	let visitorsTotal = 0;
	let sessionsTotal = 0;

	const data = Array.from( { length: days }, ( _, index ) => {
		const date = new Date( from.getTime() + index * DAY_MS );
		const visitors = Math.max(
			40,
			Math.round( 520 + index * 6 + Math.sin( ( index + seed ) / 2.6 ) * 180 )
		);
		const activeSessions = Math.round( visitors * 0.78 );

		visitorsTotal += visitors;
		sessionsTotal += activeSessions;

		return {
			date_start: date.toISOString(),
			date_end: toDayEnd( date ).toISOString(),
			time_interval: date.toISOString(),
			active_sessions: String( activeSessions ),
			visitors: String( visitors ),
		};
	} );

	return {
		summary: {
			active_sessions: String( sessionsTotal ),
			visitors: String( visitorsTotal ),
			date_start: from.toISOString(),
			date_end: toDayEnd( new Date( from.getTime() + ( days - 1 ) * DAY_MS ) ).toISOString(),
		},
		data,
	};
}

apiFetch.use( async ( options, next ) => {
	const requestPath = String( options.path ?? options.url ?? '' );

	if ( requestPath.startsWith( API_BASE ) ) {
		const withoutBase = requestPath.slice( API_BASE.length );
		const queryIndex = withoutBase.indexOf( '?' );
		const subPath = queryIndex === -1 ? withoutBase : withoutBase.slice( 0, queryIndex );
		const query = new URLSearchParams(
			queryIndex === -1 ? '' : withoutBase.slice( queryIndex + 1 )
		);

		if ( subPath === '/sessions/by-date' ) {
			return buildVisitorsByDateResponse( query );
		}
	}

	return next( options );
} );

interface VisitorsOverTimeDashboardStoryProps extends WidgetDashboardWithWidgetControls {
	withComparison: boolean;
}

function VisitorsOverTimeDashboardStory( {
	withComparison,
	...dashboardStoryArgs
}: VisitorsOverTimeDashboardStoryProps ) {
	ensureLineChartComposition();

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ VISITORS_OVER_TIME_RENDER_MODULE }
			renderComponent={ VisitorsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {
				reportParams: getDefaultQueryParams( withComparison ),
			} }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VisitorsOverTime',
	component: VisitorsOverTimeDashboardStory,
	tags: [ 'autodocs' ],
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
		},
	},
	parameters: {
		docs: {
			description: {
				component: 'Dashboard widget that displays website visitor trends for the selected period.',
			},
		},
	},
} satisfies Meta< typeof VisitorsOverTimeDashboardStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const WidgetDashboardWithWidget: Story = {};
