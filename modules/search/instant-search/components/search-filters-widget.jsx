/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

/**
 * Internal dependencies
 */
//import SearchFilterDates from './search-filter-dates';
//import SearchFilterTaxonomy from './search-filter-taxonomy';
//import SearchFilterPostTypes from './search-filter-post-types';

class SearchFiltersWidget extends Component {
	render() {
		const { widgetConfig, results } = this.props;
		let filters = widgetConfig.filters;
		var aggs = null;
		if ( results.aggregations ) {
			aggs = results.aggregations;
		}
		return <p>Here I am</p>;
		//		return (
		//			<div id={ widgetConfig.widget_id + '-wrapper' } >
		//				{ filters.map( f => {
		//					if ( aggs ) {
		//						let agg_result = aggs[f.filterName];
		//					} else {
		//						let agg_result = null;
		//					}
		//					switch( f.type )  {
		//						case 'date_histogram':
		//							return (
		//								<SearchFilterDates
		//									 agg_result={ agg_result }
		//									 title={ f.title }
		//								/>
		//							);
		//							break;
		//						case 'taxonomy':
		//							return (
		//								<SearchFilterDates
		//									 agg_result={ agg_result }
		//									 title={ f.title }
		//								/>
		//							);
		//							break;
		//						case 'post_type':
		//							return (
		//								<SearchFilterDates
		//									 agg_result={ agg_result }
		//									 title={ f.title }
		//								/>
		//							);
		//							break;
		//					}
		//				} ) }
		//			</div>
		//		);
	}
}

export default SearchFiltersWidget;
