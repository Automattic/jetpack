/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { Summary as SummaryFeature } from '../index';
import { buildInitialState } from './fixtures';
import { render, screen } from './test-utils';
import * as recommendationActions from 'state/recommendations/actions';

describe( 'Recommendations – Summary', () => {
	sinon.stub( recommendationActions, 'updateRecommendationsStep' ).returns( { type: '', step: 2 } );

	describe( 'Loading cards when fetching data', () => {
		it( "shows loading card when site's plan is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: undefined } ),
			} );

			expect( screen.getAllByAltText( 'Loading recommendations' ) ).to.be.not.null;
		} );

		it( "shows loading card when site's Rewind state is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: 'jetpack_free', rewindStatus: {} } ),
			} );

			expect( screen.getAllByAltText( 'Loading recommendations' ) ).to.be.not.null;
		} );
	} );

	describe( "Sidebar's upsell card on site with Jetpack Free", () => {
		it( 'shows the upsell no price card when hide_upsell is true', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { hideUpsell: true, productSlug: 'jetpack_free' } ),
			} );

			expect( screen.getByText( 'Recommended premium product' ) ).to.be.not.null;
			expect( screen.getByText( 'Powerful security, performance, and marketing' ) ).to.be.not.null;
		} );

		it( 'shows the upsell card when hide_upsell is false', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: 'jetpack_free' } ),
			} );

			expect( screen.getByText( 'Backup Daily' ) ).to.be.not.null;
		} );
	} );

	describe( "Sidebar's card on site with Rewind enabled (paid plan included)", () => {
		it( 'shows one click restores card when waiting for credentials', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					productSlug: 'jetpack_backup_daily',
					rewindStatus: { state: 'awaiting_credentials' },
				} ),
			} );

			expect( screen.getAllByText( 'Enable one-click restores' ) ).to.be.not.null;
		} );

		it( 'show manage security card when active or provisioning', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					productSlug: 'jetpack_backup_daily',
					rewindStatus: { state: 'active' },
				} ),
			} );

			expect( screen.getByText( 'Manage your security on Jetpack.com' ) ).to.be.not.null;
		} );
	} );
} );
