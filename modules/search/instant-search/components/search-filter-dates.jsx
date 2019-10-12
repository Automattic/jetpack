/** @jsx h */

/**
 * External dependencies
 */
import { h, createRef, Component } from 'preact';
import strip from 'strip';
import { getCheckedInputNames } from '../lib/dom';

export default class SearchFilterDates extends Component {
	constructor( props ) {
		super( props );
		this.state = { selected: this.props.initialValue };
		this.filtersList = createRef();
	}

	getIdentifier() {
		// (month || year)_(post_date || post_date_gmt || post_modified || post_modified_gmt )
		// Ex: month_post_date_gmt
		return `${ this.props.configuration.interval }_${ this.props.configuration.field }`;
	}

	toggleFilter = () => {
		const selected = getCheckedInputNames( this.filtersList.current );
		this.setState( { selected }, () => {
			this.props.onChange( this.getIdentifier(), selected );
		} );
	};

	renderDates = ( { key_as_string: key, doc_count: count } ) => {
		return (
			<div>
				<input
					checked={ this.state.selected && this.state.selected.includes( key ) }
					id={ `jp-instant-search-filter-dates-${ this.getIdentifier() }-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
				/>
				<label htmlFor={ `jp-instant-search-filter-dates-${ this.getIdentifier() }-${ key }` }>
					{ strip( key ) } ({ count })
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
						[
							...this.props.aggregation.buckets
								// TODO: Remove this filter; API should only be sending buckets with document counts.
								.filter( bucket => !! bucket && bucket.doc_count > 0 )
								.map( this.renderDates ),
						]
							// TODO: Remove this reverse & slice when API adds filter count support
							.reverse()
							.slice( 0, this.props.configuration.count ) }
				</div>
			</div>
		);
	}
}
