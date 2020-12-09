/**
 * External dependencies
 */
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { CreativeMailQuestion } from './questions/creative-mail';
import { MonitorQuestion } from './questions/monitor';
import { RelatedPostsQuestion } from './questions/related-posts';
import { SiteAcceleratorQuestion } from './questions/site-accelerator';
import { SiteTypeQuestion } from './questions/site-type';
import { WooCommerceQuestion } from './questions/woocommerce';
import { Summary } from './summary';
import QueryProducts from 'components/data/query-products';
import QueryRecommendationsData from 'components/data/query-recommendations-data';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QuerySite from 'components/data/query-site';
import QuerySitePlugins from 'components/data/query-site-plugins';
import { getStep } from 'state/recommendations';

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
		case 'related-posts':
			redirectPath = '/related-posts';
			break;
		case 'creative-mail':
			redirectPath = '/creative-mail';
			break;
		case 'site-accelerator':
			redirectPath = '/site-accelerator';
			break;
		case 'summary':
			redirectPath = '/summary';
			break;
		default:
			throw `Unknown step ${ step } in RecommendationsComponent`;
	}

	return (
		<>
			<QueryProducts />
			<QueryRecommendationsData />
			<QueryRewindStatus />
			<QuerySite />
			<QuerySitePlugins />
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
				<Route path="/recommendations/related-posts">
					<RelatedPostsQuestion />
				</Route>
				<Route path="/recommendations/creative-mail">
					<CreativeMailQuestion />
				</Route>
				<Route path="/recommendations/site-accelerator">
					<SiteAcceleratorQuestion />
				</Route>
				<Route path="/recommendations/summary">
					<Summary />
				</Route>
			</Switch>
		</>
	);
};

export const Recommendations = connect(
	state => ( { step: getStep( state ) } ),
	dispatch => ( {} )
)( RecommendationsComponent );
