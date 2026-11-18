/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { mockApiFetch } from '../../../src/dashboard/test-utils/mock-api-fetch';
import {
	VIDEO_PLAYS_REPORT_PARAMS,
	VIDEO_PLAYS_RESPONSE,
} from '../../../src/dashboard/test-utils/video-plays-response';
import { getQueryClient } from '../../../src/dashboard/utils/query-client';
import MostViewed from '../render';

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

jest.mock( '../../../src/dashboard/components/overview/most-viewed-card', () => ( {
	__esModule: true,
	default: ( { videos }: { videos: Array< { id: string; title: string } > } ) => (
		<ol>
			{ videos.map( video => (
				<li key={ video.id }>{ video.title }</li>
			) ) }
		</ol>
	),
} ) );

describe( 'MostViewed widget', () => {
	afterEach( () => {
		getQueryClient().clear();
	} );

	it( 'ranks the videos of the period by views', async () => {
		mockApiFetch( () => VIDEO_PLAYS_RESPONSE );

		render( <MostViewed attributes={ { reportParams: VIDEO_PLAYS_REPORT_PARAMS } } /> );

		await expect( screen.findByText( 'Alpha' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'Alpha',
			'Beta',
		] );
	} );
} );
