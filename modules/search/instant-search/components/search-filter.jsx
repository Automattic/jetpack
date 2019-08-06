/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

class SearchFilter extends Component {
	getTitle() {
		return strip( this.props.result.fields.title_html ) || 'Unknown Title';
	}

	render() {
		const { agg_results = [], title } = this.props;
		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">{ title }</h4>
				<ul className="jetpack-search-filters-widget__filter-list" />
			</div>
		);
	}
}

//					{ agg_results.map( result => (
//						<li>
//							<label>
//								<input type="checkbox" style="cursor: inherit;"/>
//								&nbsp;
//								<a href="http://gibrown.wpsandbox.me/main/?s=post&amp;orderby=relevance&amp;order=DESC&amp;year=2018&amp;monthnum=9&amp;day">
//									{ result['key'] }&nbsp;({ result['count'] })
//								</a>
//							</label>
//						<li>
//					) ) }

export default SearchFilter;
