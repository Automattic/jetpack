/** @jsx h */

/**
 * External dependencies
 */
import { h, createRef, Component } from 'preact';
import strip from 'strip';

/**
 * Internal dependencies
 */
import { getCheckedInputNames } from '../lib/dom';

export default class SearchFilterPostTypes extends Component {
	constructor( props ) {
		super( props );
		this.state = { selected: this.props.initialValue };
		this.filtersList = createRef();
	}

	toggleFilter = () => {
		const selected = getCheckedInputNames( this.filtersList.current );
		this.setState( { selected }, () => {
			this.props.onChange( 'post_types', selected );
		} );
	};

	renderPostType = ( { key, doc_count: count } ) => {
		const name = key in this.props.postTypes ? this.props.postTypes[ key ] : key;
		return (
			<div>
				<input
					checked={ this.state.selected.includes( key ) }
					id={ `jp-instant-search-filter-post-types-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
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
				<h4 className="jetpack-search-filters-widget__sub-heading">
					{ this.props.configuration.name }
				</h4>
				<div className="jetpack-search-filters-widget__filter-list" ref={ this.filtersList }>
					{ this.props.aggregation &&
						'buckets' in this.props.aggregation &&
						this.props.aggregation.buckets.map( this.renderPostType ) }
				</div>
			</div>
		);
	}
}
