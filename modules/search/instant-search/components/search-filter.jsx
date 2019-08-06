/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

class SearchFilter extends Component {
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
		const { results = [], type, filterName } = this.props;
		if ( typeof results.aggregations == 'undefined' ) {
			return this.renderWrapper( null );
		}
		const this_result = results.aggregations[ filterName ];
		if ( typeof this_result == 'undefined' ) {
			return this.renderWrapper( null );
		}

		var el = null;
		switch ( type ) {
			case 'date_histogram':
				break;
			case 'taxonomy':
				el = results.map( result => (
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
				break;
			case 'post_type':
				el = results.map( result => (
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
				break;
		}
		return this.renderWrapper( el );
	}
}

export default SearchFilter;
