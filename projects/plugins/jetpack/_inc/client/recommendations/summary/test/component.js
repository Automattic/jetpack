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
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen, within } from 'test/test-utils';

describe( 'Recommendations – Summary', () => {
	let updateRecommendationsStepStub;

	before( function () {
		const DUMMY_ACTION = { type: 'dummy' };
		updateRecommendationsStepStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsStep' )
			.returns( DUMMY_ACTION );
	} );

	after( function () {
		updateRecommendationsStepStub.restore();
	} );

	describe( 'Loading cards when fetching data', () => {
		it( "shows loading card when site's plan is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: undefined } ),
			} );

			expect( screen.getAllByAltText( 'Loading...' ) ).to.be.not.null;
		} );

		it( "shows loading card when site's Rewind state is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: 'jetpack_free', rewindStatus: {} } ),
			} );

			expect( screen.getAllByAltText( 'Loading...' ) ).to.be.not.null;
		} );
	} );

	describe( 'Sidebar', () => {
		describe( 'Site with Jetpack Free', () => {
			it( 'shows the upsell no price card when hide_upsell is true', () => {
				render( <SummaryFeature />, {
					initialState: buildInitialState( { hideUpsell: true, productSlug: 'jetpack_free' } ),
				} );

				expect( screen.getByText( 'Recommended premium product' ) ).to.be.not.null;
				expect( screen.getByText( 'Powerful security, performance, and marketing' ) ).to.be.not
					.null;
			} );

			it( 'shows the upsell card when hide_upsell is false', () => {
				render( <SummaryFeature />, {
					initialState: buildInitialState( { productSlug: 'jetpack_free' } ),
				} );

				expect( screen.getByText( 'Backup Daily' ) ).to.be.not.null;
			} );
		} );

		describe( 'Site with paid plan (Rewind enabled)', () => {
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

	describe( 'Content', () => {
		it( 'shows the enabled recommendation (Related Posts)', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					enabledRecommendations: { 'related-posts': true },
					productSlug: 'jetpack_free',
				} ),
			} );

			const enabledFeatures = screen.getByRole( 'region', { name: /recommendations enabled/i } );

			expect( enabledFeatures ).to.be.not.null;
			expect( within( enabledFeatures ).getByText( 'Related Posts' ) ).to.be.not.null;
		} );

		it( 'shows the skipped recommendations (Monitor, Site Accelerator, and Creative Mail)', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					enabledRecommendations: { 'related-posts': true },
					productSlug: 'jetpack_free',
				} ),
			} );

			const skippedFeatures = screen.getByRole( 'region', { name: /recommendations skipped/i } );

			expect( skippedFeatures ).to.be.not.null;
			expect( within( skippedFeatures ).getByText( 'Downtime Monitoring' ) ).to.be.not.null;
			expect( within( skippedFeatures ).getByText( 'Site Accelerator' ) ).to.be.not.null;
			expect( within( skippedFeatures ).getByText( 'Creative Mail' ) ).to.be.not.null;
		} );
	} );
} );
