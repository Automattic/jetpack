/** @jsx h */

/**
 * External dependencies
 */
import Component from 'preact';
import strip from 'strip';

class SearchFilterTaxonomy extends Component {
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
		const { agg_result = null } = this.props;

		if ( ! agg_result ) {
			return this.renderWrapper( null );
		}

		let el = results.map( result => (
			<li>
				<label>
					<input type="checkbox" style="cursor: inherit;" />
					&nbsp;
					<a href="http://fixme">
						{ strip( result[ 'key' ] ) }&nbsp;({ result[ 'count' ] })
					</a>
				</label>
			</li>
		) );
		return this.renderWrapper( el );
	}
}

export default SearchFilterTaxonomy;
