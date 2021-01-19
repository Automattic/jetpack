/**
 * External dependencies
 */
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import QuerySetupWizardQuestionnaire from 'components/data/query-setup-wizard-questionnaire';
import { getSiteTitle } from 'state/initial-state';
import { getSetupWizardStatus } from 'state/setup-wizard';

import { IntroPage } from './intro-page';
import { IncomeQuestion } from './income-question';
import { UpdatesQuestion } from './updates-question';
import { RecommendedFeatures } from './recommended-features';

const SetupWizardComponent = props => {
	const { siteTitle, status } = props;

	let redirectPath;
	switch ( status ) {
		case 'not-started':
		case 'intro-page':
			redirectPath = '/intro';
			break;
		case 'income-page':
			redirectPath = '/income';
			break;
		case 'updates-page':
			redirectPath = '/updates';
			break;
		case 'features-page':
		case 'completed':
			redirectPath = '/features';
			break;
		default:
			throw `Unknown status ${ status } in SetupWizardComponent`;
	}

	return (
		<>
			<QuerySite />
			<QuerySitePlugins />
			<QueryRewindStatus />
			<QueryVaultPressData />
			<QueryAkismetKeyCheck />
			<QuerySetupWizardQuestionnaire />
			<Switch>
				<Redirect exact from={ '/setup' } to={ '/setup' + redirectPath } />
				<Route path={ `/setup/intro` }>
					<IntroPage siteTitle={ siteTitle } />
				</Route>
				<Route path={ `/setup/income` }>
					<IncomeQuestion siteTitle={ siteTitle } />
				</Route>
				<Route path={ `/setup/updates` }>
					<UpdatesQuestion siteTitle={ siteTitle } />
				</Route>
				<Route path={ `/setup/features` }>
					<RecommendedFeatures />
				</Route>
			</Switch>
		</>
	);
};

export const SetupWizard = connect( state => {
	return {
		siteTitle: getSiteTitle( state ),
		status: getSetupWizardStatus( state ),
	};
} )( SetupWizardComponent );
