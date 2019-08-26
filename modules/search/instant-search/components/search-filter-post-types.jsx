/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

export default class SearchFilterPostTypes extends Component {
	render() {
		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">{ this.props.filter.name }</h4>
				<ul className="jetpack-search-filters-widget__filter-list">
					{ this.props.aggregation &&
						'buckets' in this.props.aggregation &&
						this.props.aggregation.buckets.map( bucket => (
							<div>
								<input
									type="checkbox"
									name=""
									id={ `jp-instant-search-filter-post-types-${ bucket.key }` }
									disabled
								/>
								<label htmlFor={ `jp-instant-search-filter-post-types-${ bucket.key }` }>
									{ strip( bucket.key ) } ({ bucket.doc_count })
								</label>
							</div>
						) ) }
				</ul>
			</div>
		);
	}
}
