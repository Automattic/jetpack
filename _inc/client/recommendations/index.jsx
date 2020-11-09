/**
 * External dependencies
 */
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getStep } from 'state/recommendations';
import { SiteTypeQuestion } from './questions/site-type';

const RecommendationsComponent = props => {
	const { step } = props;

	let redirectPath;
	switch ( step ) {
		case 'not-started':
		case 'site-type':
			redirectPath = '/site-type';
			break;
		default:
			throw `Unknown status ${ status } in RecommendationsComponent`;
	}

	return (
		<Switch>
			<Redirect exact from={ '/recommendations' } to={ '/recommendations' + redirectPath } />
			<Route path="/recommendations/site-type">
				<SiteTypeQuestion />
			</Route>
		</Switch>
	);
};

export const Recommendations = connect(
	state => ( { step: getStep( state ) } ),
	dispatch => ( {} )
)( RecommendationsComponent );
