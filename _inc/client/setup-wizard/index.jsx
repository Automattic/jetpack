/**
 * External dependencies
 */
import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import QuerySetupWizardQuestionnaire from 'components/data/query-setup-wizard-questionnaire';
import { getSiteTitle } from 'state/initial-state';

import { IntroPage } from './intro-page';
import { IncomeQuestion } from './income-question';
import { UpdatesQuestion } from './updates-question';
import { RecommendedFeatures } from './recommended-features';

const SetupWizardComponent = props => {
	const { path } = useRouteMatch();

	return (
		<>
			<QuerySite />
			<QueryRewindStatus />
			<QueryVaultPressData />
			<QueryAkismetKeyCheck />
			<QuerySetupWizardQuestionnaire />
			<Switch>
				<Route exact path={ `${ path }` }>
					<IntroPage siteTitle={ props.siteTitle } />
				</Route>
				<Route path={ `${ path }/income` }>
					<IncomeQuestion siteTitle={ props.siteTitle } />
				</Route>
				<Route path={ `${ path }/updates` }>
					<UpdatesQuestion siteTitle={ props.siteTitle } />
				</Route>
				<Route path={ `${ path }/features` }>
					<RecommendedFeatures />
				</Route>
			</Switch>
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteTitle: getSiteTitle( state ) };
} )( SetupWizardComponent );
