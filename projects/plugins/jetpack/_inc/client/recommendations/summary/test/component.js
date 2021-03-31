/**
 * External dependencies
 */
import { render as rtlRender, screen } from '@testing-library/react';
import { createStore } from 'redux';
import * as React from 'react';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { Summary as SummaryFeature } from '../index';
import * as recommendationActions from 'state/recommendations/actions';

function reducer( state = {} ) {
	return state;
}

function render(
	ui,
	{ initialState, store = createStore( reducer, initialState ), ...renderOptions } = {}
) {
	const Wrapper = ( { children } ) => <Provider store={ store }>{ children }</Provider>;

	return rtlRender( ui, { wrapper: Wrapper, ...renderOptions } );
}

function rewindFixture( rewindStatus ) {
	return {
		data: {
			status: rewindStatus,
		},
	};
}

function siteDataFixture( { productSlug }) {
	return {
		data: {
			plan: {
				product_slug: productSlug,
			},
		},
	};
}

function upsellFixture( { hideUpsell } ) {
	return {
		product_id: 2101,
		billing_timeframe: 'billed monthly',
		cost_timeframe: 'per month',
		cta_text: 'Learn more',
		currency_code: 'USD',
		description:
			'Never lose a word, image, page, or time worrying about your site with automated off-site backups and one-click restores.',
		features: [
			'Automated daily off-site backups',
			'One-click restores',
			'Unlimited secure storage',
		],
		header: 'Recommended premium product',
		hide_upsell: hideUpsell,
		price: 9.95,
		title: 'Backup Daily',
	};
}

function buildInitialState( { hideUpsell = false, productSlug, rewindStatus = { state: 'unavailable' } } = {} ) {
	return {
		jetpack: {
			initialState: {
				userData: {
					currentUser: 100,
				},
			},
			connection: {
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			pluginsData: {
				items: [],
			},
			recommendations: {
				upsell: upsellFixture( { hideUpsell } ),
			},
			rewind: rewindFixture( rewindStatus ),
			settings: {
				items: [],
			},
			siteData: siteDataFixture( { productSlug } ),
		},
	};
}

describe( "Recommendations – Summary section", () => {
	sinon.stub( recommendationActions, 'updateRecommendationsStep' ).returns( { type: '', step: 2 } );

  describe( "Loading cards when fetching data", () => {
    it( "shows loading card when site's plan is being fetched", () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { productSlug: undefined } ) } );

      expect( screen.getAllByAltText( 'Loading recommendations' )).to.be.not.null;
    } );

    it( "shows loading card when site's Rewind state is being fetched", () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { productSlug: 'jetpack_free', rewindStatus: {} } ) } );

      expect( screen.getAllByAltText( 'Loading recommendations' )).to.be.not.null;
    } );
  } );

	describe( "Sidebar's upsell card on site with Jetpack Free", () => {
		it( 'shows the upsell no price card when hide_upsell is true', () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { hideUpsell: true, productSlug: 'jetpack_free' } ) } );


			expect( screen.getByText( 'Recommended premium product' ) ).to.be.not.null;
			expect( screen.getByText( 'Powerful security, performance, and marketing' ) ).to.be.not.null;
		} );

		it( 'shows the upsell card when hide_upsell is false', () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { productSlug: 'jetpack_free' } ) } );

      expect( screen.getByText( 'Backup Daily' )).to.be.not.null;
    } );
	} );

  describe( "Sidebar's card on site with Rewind enabled (paid plan included)", () => {

    it( 'shows one click restores card when waiting for credentials', () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { productSlug: 'jetpack_backup_daily', rewindStatus: { state: 'awaiting_credentials' } } ) } );

      expect( screen.getAllByText(  'Enable one-click restores' )).to.be.not.null;
    } );

    it( 'show manage security card when active or provisioning', () => {
			render( <SummaryFeature />, { initialState: buildInitialState( { productSlug: 'jetpack_backup_daily', rewindStatus: { state: 'active' } } ) } );

      expect( screen.getByText( 'Manage your security on Jetpack.com' )).to.be.not.null;
    } );
  } );
} );
