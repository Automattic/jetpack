import { jest } from '@jest/globals';
import * as React from 'react';
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen, within } from 'test/test-utils';
import {
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_SEARCH,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
} from '../../../lib/plans/constants';
import { getOnboardingNameByProductSlug } from '../../../state/recommendations/onboarding-utils';
import { Summary as SummaryFeature } from '../index';
import { buildInitialState } from './fixtures';

describe( 'Recommendations – Summary', () => {
	const DUMMY_ACTION = { type: 'dummy' };

	let updateRecommendationsStepStub;
	let addViewedRecommendationStub;

	beforeAll( () => {
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
					skippedRecommendations: [ 'monitor', 'site-accelerator', 'creative-mail' ],
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

	describe( 'Onboardings', () => {
		let updateOnboardingDataStub;

		beforeEach( () => {
			updateOnboardingDataStub = jest
				.spyOn( recommendationsActions, 'updateRecommendationsOnboardingData' )
				.mockReturnValue( DUMMY_ACTION );
		} );

		afterEach( () => {
			updateOnboardingDataStub.mockRestore();
		} );

		it( 'Ends onboarding on render if one is active', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					onboardingActive: 'Foo',
				} ),
			} );

			expect( updateOnboardingDataStub ).toHaveBeenCalledWith( { active: null } );

			updateOnboardingDataStub.mockRestore();
		} );

		it( 'Does not update onboarding data if onboarding is not active', () => {
			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					onboardingActive: null,
				} ),
			} );

			expect( updateOnboardingDataStub ).not.toHaveBeenCalled();
		} );

		it( 'Displays summary of viewed onboardings', () => {
			const productSlugs = [ PLAN_JETPACK_SEARCH, PLAN_JETPACK_ANTI_SPAM ];
			const eligiblePurchases = productSlugs.map( slug => ( {
				product_slug: slug,
				active: '1',
				subscribed_date: new Date().toString(),
			} ) );

			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					onboardingViewed: productSlugs.map( getOnboardingNameByProductSlug ),
					sitePurchases: eligiblePurchases,
				} ),
			} );

			const searchSummary = screen.getByRole( 'region', { name: /part of your search plan/i } );
			expect( searchSummary ).toBeInTheDocument();
			expect( within( searchSummary ).getByText( 'Custom Site Search' ) ).toBeInTheDocument();

			const antiSpamSummary = screen.getByRole( 'region', {
				name: /part of your anti-spam plan/i,
			} );
			expect( antiSpamSummary ).toBeInTheDocument();
			expect(
				within( antiSpamSummary ).getByText( 'Automated Spam Protection' )
			).toBeInTheDocument();
		} );

		it( "Doesn't display summaries of onboardings that overlap with more important one", () => {
			const productSlugs = [ PLAN_JETPACK_SECURITY_T1_MONTHLY, PLAN_JETPACK_ANTI_SPAM ];
			const eligiblePurchases = productSlugs.map( slug => ( {
				product_slug: slug,
				active: '1',
				subscribed_date: new Date().toString(),
			} ) );

			render( <SummaryFeature />, {
				initialState: buildInitialState( {
					onboardingViewed: productSlugs.map( getOnboardingNameByProductSlug ),
					sitePurchases: eligiblePurchases,
				} ),
			} );

			const securitySummary = screen.getByRole( 'region', { name: /part of your security plan/i } );
			expect( securitySummary ).toBeInTheDocument();
			expect( within( securitySummary ).getByText( 'Real-time Backups' ) ).toBeInTheDocument();
			expect(
				within( securitySummary ).getByText( 'Real-time Malware Scanning' )
			).toBeInTheDocument();
			expect(
				within( securitySummary ).getByText( 'Automated Spam Protection' )
			).toBeInTheDocument();

			expect(
				screen.queryByRole( 'region', {
					name: /part of your anti-spam plan/i,
				} )
			).not.toBeInTheDocument();
		} );
	} );
} );
