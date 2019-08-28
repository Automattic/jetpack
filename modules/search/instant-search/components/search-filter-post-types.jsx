/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

export default class SearchFilterPostTypes extends Component {
	renderPostType = ( { key, doc_count: count } ) => {
		const name = this.props.postTypes[ key ];
		return (
			<div>
				<input
					disabled
					id={ `jp-instant-search-filter-post-types-${ key }` }
					name={ key }
					type="checkbox"
				/>
				<label htmlFor={ `jp-instant-search-filter-post-types-${ key }` }>
					{ strip( name ) } ({ count })
				</label>
			</div>
		);
	};
	render() {
		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">{ this.props.filter.name }</h4>
				<ul className="jetpack-search-filters-widget__filter-list">
					{ this.props.aggregation &&
						'buckets' in this.props.aggregation &&
						this.props.aggregation.buckets.map( this.renderPostType ) }
				</ul>
			</div>
		);
	}
}
