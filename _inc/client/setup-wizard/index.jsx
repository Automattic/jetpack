/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import { getSiteRawUrl } from 'state/initial-state';

import { IntroPage } from './intro-page';

const SetupWizardComponent = props => {
	return (
		<>
			<QuerySite />
			<IntroPage siteRawUrl={ props.siteRawUrl } />
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteRawUrl: getSiteRawUrl( state ) };
} )( SetupWizardComponent );
