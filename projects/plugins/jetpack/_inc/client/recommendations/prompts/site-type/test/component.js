import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import * as React from 'react';
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen } from 'test/test-utils';
import { SiteTypeQuestion } from '../index';
import '@testing-library/jest-dom/extend-expect';

/**
 * Build initial state.
 *
 * @returns {object} State.
 */
function buildInitialState() {
	return {
		jetpack: {
			initialState: {
				recommendationsStep: 'site-type-question',
				siteTitle: 'Test Site',
			},
			pluginsData: {
				items: {
					'jetpack/jetpack.php': {
						active: true,
					},
				},
			},
			recommendations: {
				data: {
					'site-type-store': true,
					'site-type-business': true,
				},
				requests: {
					isFetchingRecommendationsProductSuggestions: false,
				},
			},
			settings: {
				items: [],
			},
			siteData: {
				requests: {
					isFetchingSiteDiscount: false,
				},
			},
			introOffers: {
				requests: {
					isFetching: false,
				},
			},
		},
	};
}

describe( 'Recommendations – Site Type', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	let updateRecommendationsStepStub;

	beforeAll( () => {
		updateRecommendationsStepStub = jest
			.spyOn( recommendationsActions, 'updateRecommendationsStep' )
			.mockReturnValue( DUMMY_ACTION );
	} );

	afterAll( () => {
		updateRecommendationsStepStub.mockRestore();
	} );

	it( 'shows the Site Type Question component', () => {
		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );
		expect( screen.getByText( 'What type of site is Test Site?' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Personal' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Business' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Store' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Other' ) ).toBeInTheDocument();
	} );

	it( 'shows questions with the right default initial state', () => {
		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );
		expect( screen.getByLabelText( 'Personal' ) ).not.toBeChecked();
		expect( screen.getByLabelText( 'Business' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Store' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Other' ) ).not.toBeChecked();
	} );

	it( 'updates the state of a question when an answer is clicked', async () => {
		const user = userEvent.setup();

		const updateRecommendationsDataStub = jest
			.spyOn( recommendationsActions, 'updateRecommendationsData' )
			.mockReturnValue( { type: 'dummy' } );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const personalCheckbox = screen.getByLabelText( 'Personal' );
		expect( personalCheckbox.checked ).toBe( false );

		await user.click( personalCheckbox );

		expect( updateRecommendationsDataStub ).toHaveBeenCalledTimes( 1 );

		updateRecommendationsDataStub.mockRestore();
	} );

	it( 'saves the answers when clicking on continue', async () => {
		const user = userEvent.setup();

		const saveRecommendationsStub = jest
			.spyOn( recommendationsActions, 'saveRecommendationsData' )
			.mockReturnValue( DUMMY_ACTION );
		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const continueLink = screen.getByRole( 'link', { name: /continue/i } );
		expect( continueLink.href ).toContain( '/recommendations/woocommerce' );

		expect( saveRecommendationsStub ).not.toHaveBeenCalled();
		await user.click( continueLink );
		expect( saveRecommendationsStub ).toHaveBeenCalledTimes( 1 );

		saveRecommendationsStub.mockRestore();
		recordEventStub.mockRestore();
	} );

	it( 'tracks the event (answers included) when clicking on continue', async () => {
		const user = userEvent.setup();

		const saveRecommendationsStub = jest
			.spyOn( recommendationsActions, 'saveRecommendationsData' )
			.mockReturnValue( DUMMY_ACTION );
		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const continueLink = screen.getByRole( 'link', { name: /continue/i } );
		expect( recordEventStub ).not.toHaveBeenCalled();
		await user.click( continueLink );
		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_recommendations_site_type_answered', {
			personal: false,
			business: true,
			store: true,
			other: false,
		} );

		recordEventStub.mockRestore();
		saveRecommendationsStub.mockRestore();
	} );
} );
