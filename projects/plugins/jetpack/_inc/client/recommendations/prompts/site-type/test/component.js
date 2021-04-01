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
import { fireEvent, render, screen } from '../../../summary/test/test-utils';
import analytics from 'lib/analytics';
import * as recommendationsActions from 'state/recommendations/actions';

function buildInitialState() {
	return {
		jetpack: {
			initialState: {
				recommendationsStep: 'site-type-question',
				siteTitle: 'Test Site',
			},
			// && state.jetpack.pluginsData.items[ plugin ].active
			pluginsData: {
				items: {
					'jetpack/jetpack.php': {
						Name: 'Jetpack by WordPress.com',
						PluginURI: 'https://jetpack.com',
						Version: '9.6-alpha',
						Description:
							'Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.',
						Author: 'Automattic',
						AuthorURI: 'https://jetpack.com',
						TextDomain: 'jetpack',
						DomainPath: '',
						Network: false,
						RequiresWP: '5.6',
						RequiresPHP: '5.6',
						Title: 'Jetpack by WordPress.com',
						AuthorName: 'Automattic',
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
		sinon.stub( recommendationsActions, 'updateRecommendationsData' ).returns( {
			type: 'dummy',
		} );

		render( <SiteTypeQuestion />, {
			initialState: buildInitialState(),
		} );

		const personalCheckbox = screen.getByLabelText( 'Personal' );
		expect( personalCheckbox.checked ).to.be.false;
		fireEvent.click( personalCheckbox );
		expect( personalCheckbox.checked ).to.be.true;
	} );
} );
