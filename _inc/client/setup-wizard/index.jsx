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
import { getSiteTitle } from 'state/initial-state';

import { IntroPage } from './intro-page';
import { IncomeQuestion } from './income-question';
import { UpdatesQuestion } from './updates-question';

const SetupWizardComponent = props => {
	const { path } = useRouteMatch();

	return (
		<>
			<QuerySite />
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
			</Switch>
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteTitle: getSiteTitle( state ) };
} )( SetupWizardComponent );
