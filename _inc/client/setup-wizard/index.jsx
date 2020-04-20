/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import { getSiteTitle } from 'state/initial-state';

import { IntroPage } from './intro-page';
import { IncomeQuestion } from './income-question';

const SetupWizardComponent = props => {
	let pageComponent;
	switch ( props.route ) {
		case '/setup':
			pageComponent = <IntroPage siteTitle={ props.siteTitle } />;
			break;
		case '/setup/income':
			pageComponent = <IncomeQuestion siteRawUrl={ props.siteRawUrl } />;
			break;
	}

	return (
		<>
			<QuerySite />
			{ pageComponent }
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteTitle: getSiteTitle( state ) };
} )( SetupWizardComponent );
