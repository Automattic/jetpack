/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { SiteTypeQuestion } from '../index';
import analytics from 'lib/analytics';
import * as recommendationsActions from 'state/recommendations/actions';
import { fireEvent, render, screen } from 'test/test-utils';

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
			},
			settings: {
				items: [],
			},
		},
	};
}

describe( 'Recommendations – Site Type', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	let updateRecommendationsStepStub;

	before( function () {
		updateRecommendationsStepStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsStep' )
			.returns( DUMMY_ACTION );
	} );

	after( function () {
		updateRecommendationsStepStub.restore();
	} );

	it( 'shows the Site Type Question component', () => {
		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );
		expect( screen.getAllByText( 'What type of site is Test Site?' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Personal' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Business' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Store' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Other' ) ).to.be.not.null;
	} );

	it( 'shows questions with the right default initial state', () => {
		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );
		expect( screen.getByLabelText( 'Personal' ).checked ).to.be.false;
		expect( screen.getByLabelText( 'Business' ).checked ).to.be.true;
		expect( screen.getByLabelText( 'Store' ).checked ).to.be.true;
		expect( screen.getByLabelText( 'Other' ).checked ).to.be.false;
	} );

	it( 'updates the state of a question when an answer is clicked', () => {
		const updateRecommendationsDataStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsData' )
			.returns( {
				type: 'dummy',
			} );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const personalCheckbox = screen.getByLabelText( 'Personal' );
		expect( personalCheckbox.checked ).to.be.false;
		fireEvent.click( personalCheckbox );
		expect( personalCheckbox.checked ).to.be.true;

		updateRecommendationsDataStub.restore();
	} );

	it( 'saves the answers when clicking on continue', () => {
		const saveRecommendationsStub = sinon.stub( recommendationsActions, 'saveRecommendationsData' );
		saveRecommendationsStub.returns( DUMMY_ACTION );
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const continueLink = screen.getByRole( 'link', { name: /continue/i } );
		expect( continueLink.href ).to.have.string( '/recommendations/woocommerce' );

		expect( saveRecommendationsStub.callCount ).to.be.equal( 0 );
		fireEvent.click( continueLink );
		expect( saveRecommendationsStub.callCount ).to.be.equal( 1 );

		saveRecommendationsStub.restore();
		recordEventStub.restore();
	} );

	it( 'tracks the event (answers included) when clicking on continue', () => {
		const saveRecommendationsStub = sinon.stub( recommendationsActions, 'saveRecommendationsData' );
		saveRecommendationsStub.returns( DUMMY_ACTION );
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const continueLink = screen.getByRole( 'link', { name: /continue/i } );
		expect( recordEventStub.callCount ).to.be.equal( 0 );
		fireEvent.click( continueLink );
		expect(
			recordEventStub.withArgs( 'jetpack_recommendations_site_type_answered', {
				personal: false,
				business: true,
				store: true,
				other: false,
			} ).callCount
		).to.be.equal( 1 );

		recordEventStub.restore();
		saveRecommendationsStub.restore();
	} );
} );
