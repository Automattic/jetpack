import { jest } from '@jest/globals';
import * as React from 'react';
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen, within } from 'test/test-utils';
import { Summary as SummaryFeature } from '../index';
import { buildInitialState } from './fixtures';

describe( 'Recommendations – Summary', () => {
	let updateRecommendationsStepStub;
	let addViewedRecommendationStub;

	beforeAll( () => {
		const DUMMY_ACTION = { type: 'dummy' };
		updateRecommendationsStepStub = jest
			.spyOn( recommendationsActions, 'updateRecommendationsStep' )
			.mockReturnValue( DUMMY_ACTION );
		addViewedRecommendationStub = jest
			.spyOn( recommendationsActions, 'addViewedRecommendation' )
			.mockReturnValue( DUMMY_ACTION );
	} );

	afterAll( () => {
		updateRecommendationsStepStub.mockRestore();
		addViewedRecommendationStub.mockRestore();
	} );

	describe( 'Loading cards when fetching data', () => {
		it( "shows loading card when site's plan is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: undefined } ),
			} );

			expect( screen.getAllByAltText( 'Loading recommendations' ).length ).toBeGreaterThan( 0 );
		} );

		it( "shows loading card when site's Rewind state is being fetched", () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( { productSlug: 'jetpack_free', rewindStatus: {} } ),
			} );

			expect( screen.getAllByAltText( 'Loading recommendations' ).length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Sidebar', () => {
		describe( 'Site with Jetpack Free', () => {
			it( 'shows the upsell no price card when hide_upsell is true', () => {
				render( <SummaryFeature />, {
					initialState: buildInitialState( { hideUpsell: true, productSlug: 'jetpack_free' } ),
				} );

				expect( screen.getByText( 'Recommended premium product' ) ).toBeInTheDocument();
				expect(
					screen.getByText( 'Powerful security, performance, and marketing' )
				).toBeInTheDocument();
			} );

			it( 'shows the upsell card when hide_upsell is false', () => {
				render( <SummaryFeature />, {
					initialState: buildInitialState( { productSlug: 'jetpack_free' } ),
				} );

				expect( screen.getByText( 'Backup Daily' ) ).toBeInTheDocument();
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

				expect(
					screen.getByText( 'Enable one-click restores', { selector: 'h2' } )
				).toBeInTheDocument();
			} );

			it( 'show manage security card when active or provisioning', () => {
				render( <SummaryFeature />, {
					initialState: buildInitialState( {
						productSlug: 'jetpack_backup_daily',
						rewindStatus: { state: 'active' },
					} ),
				} );

				expect( screen.getByText( 'Manage your security on Jetpack.com' ) ).toBeInTheDocument();
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

			expect( enabledFeatures ).toBeInTheDocument();
			expect( within( enabledFeatures ).getByText( 'Related Posts' ) ).toBeInTheDocument();
		} );

		it( 'shows the skipped recommendations (Monitor, Site Accelerator, and Creative Mail)', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					enabledRecommendations: { 'related-posts': true },
					productSlug: 'jetpack_free',
				} ),
			} );

			const skippedFeatures = screen.getByRole( 'region', { name: /recommendations skipped/i } );

			expect( skippedFeatures ).toBeInTheDocument();
			expect( within( skippedFeatures ).getByText( 'Downtime Monitoring' ) ).toBeInTheDocument();
			expect( within( skippedFeatures ).getByText( 'Site Accelerator' ) ).toBeInTheDocument();
			expect( within( skippedFeatures ).getByText( 'Creative Mail' ) ).toBeInTheDocument();
		} );
	} );
} );
