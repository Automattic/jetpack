/**
 * External dependencies
 */
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { FeaturePrompt } from './prompts/feature-prompt';
import { SiteTypeQuestion } from './prompts/site-type';
import { Summary } from './summary';
import QueryProducts from 'components/data/query-products';
import QueryRecommendationsData from 'components/data/query-recommendations-data';
import QueryRecommendationsUpsell from 'components/data/query-recommendations-upsell';
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
			<QueryRecommendationsUpsell />
			<QueryRewindStatus />
			<QuerySite />
			<QuerySitePlugins />
			<Switch>
				<Redirect exact from={ '/recommendations' } to={ '/recommendations' + redirectPath } />
				<Route path="/recommendations/site-type">
					<SiteTypeQuestion />
				</Route>
				<Route path="/recommendations/woocommerce">
					<FeaturePrompt stepSlug="woocommerce" />
				</Route>
				<Route path="/recommendations/monitor">
					<FeaturePrompt stepSlug="monitor" />
				</Route>
				<Route path="/recommendations/related-posts">
					<FeaturePrompt stepSlug="related-posts" />
				</Route>
				<Route path="/recommendations/creative-mail">
					<FeaturePrompt stepSlug="creative-mail" />
				</Route>
				<Route path="/recommendations/site-accelerator">
					<FeaturePrompt stepSlug="site-accelerator" />
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
