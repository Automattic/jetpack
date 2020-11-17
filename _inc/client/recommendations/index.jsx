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
import { WooCommerceQuestion } from './questions/woocommerce';
import { MonitorQuestion } from './questions/monitor';

const RecommendationsComponent = props => {
	const { step } = props;

	let redirectPath;
	switch ( step ) {
		case 'not-started':
		case 'site-type-question':
			redirectPath = '/site-type';
			break;
		case 'woocommerce':
			redirectPath = '/woocommerce';
			break;
		case 'monitor':
			redirectPath = '/monitor';
			break;
		default:
			throw `Unknown step ${ step } in RecommendationsComponent`;
	}

	return (
		<Switch>
			<Redirect exact from={ '/recommendations' } to={ '/recommendations' + redirectPath } />
			<Route path="/recommendations/site-type">
				<SiteTypeQuestion />
			</Route>
			<Route path="/recommendations/woocommerce">
				<WooCommerceQuestion />
			</Route>
			<Route path="/recommendations/monitor">
				<MonitorQuestion />
			</Route>
		</Switch>
	);
};

export const Recommendations = connect(
	state => ( { step: getStep( state ) } ),
	dispatch => ( {} )
)( RecommendationsComponent );
