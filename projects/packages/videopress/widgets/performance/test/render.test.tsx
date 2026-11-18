/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { mockApiFetch } from '../../../src/dashboard/test-utils/mock-api-fetch';
import {
	VIDEO_PLAYS_REPORT_PARAMS,
	VIDEO_PLAYS_RESPONSE,
} from '../../../src/dashboard/test-utils/video-plays-response';
import { getQueryClient } from '../../../src/dashboard/utils/query-client';
import Performance from '../render';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
} ) );

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () =>
	jest
		.requireActual< typeof import( '../../../src/dashboard/test-utils/fake-widget-root' ) >(
			'../../../src/dashboard/test-utils/fake-widget-root'
		)
		.fakeWidgetRoot( () => ( {} ) )
);

jest.mock( '../../../src/dashboard/components/overview/kpi-cards-row', () => ( {
	__esModule: true,
	default: ( {
		views,
		onChangeActiveMetric,
	}: {
		views: { current: number };
		onChangeActiveMetric: ( metric: string ) => void;
	} ) => (
		<button type="button" onClick={ () => onChangeActiveMetric( 'impressions' ) }>
			{ `Views: ${ views.current }` }
		</button>
	),
} ) );

jest.mock( '../../../src/dashboard/components/overview/views-trends-card', () => ( {
	__esModule: true,
	default: ( { activeMetric }: { activeMetric: string } ) => (
		<p>{ `Chart of ${ activeMetric }` }</p>
	),
} ) );

describe( 'Performance widget', () => {
	afterEach( () => {
		getQueryClient().clear();
	} );

	it( 'charts the metric its cards select, over the stats of the period', async () => {
		mockApiFetch( () => VIDEO_PLAYS_RESPONSE );

		render( <Performance attributes={ { reportParams: VIDEO_PLAYS_REPORT_PARAMS } } /> );

		expect( screen.getByText( 'Chart of views' ) ).toBeInTheDocument();
		await userEvent.click( await screen.findByRole( 'button', { name: 'Views: 15' } ) );

		expect( screen.getByText( 'Chart of impressions' ) ).toBeInTheDocument();
	} );
} );
