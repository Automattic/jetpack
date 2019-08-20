/** @jsx h */

/**
 * External dependencies
 */
import Component from 'preact';
import strip from 'strip';

class SearchFilterDates extends Component {
	renderWrapper( el ) {
		const { title } = this.props;
		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">{ title }</h4>
				<ul className="jetpack-search-filters-widget__filter-list">{ el }</ul>
			</div>
		);
	}

	render() {
		const { title, agg_result = null } = this.props;

		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">{ title }</h4>
				<ul className="jetpack-search-filters-widget__filter-list">{ null }</ul>
			</div>
		);
		//		if ( ! agg_result ) {
		//			return this.renderWrapper( null );
		//		}
		//		//TODO: fixme
		//		return this.renderWrapper( null );
	}
}

export default SearchFilterDates;
