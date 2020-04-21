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

const SetupWizardComponent = props => {
	return (
		<>
			<QuerySite />
			<IntroPage siteTitle={ props.siteTitle } />
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteTitle: getSiteTitle( state ) };
} )( SetupWizardComponent );
