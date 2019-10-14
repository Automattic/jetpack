/** @jsx h */

/**
 * External dependencies
 */
import { h, createRef, Component } from 'preact';
import { getCheckedInputNames } from '../lib/dom';

export default class SearchFilterDates extends Component {
	constructor( props ) {
		super( props );
		this.state = { selected: this.props.initialValue };
		this.filtersList = createRef();

		//this assumes that the configuration never changes and we
		// may eventually want to adjust it dynamically
		this.dateOptions = {
			year: 'numeric',
			month: 'long',
		};
		switch ( this.props.configuration.interval ) {
			case 'day':
				this.dateOptions = {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				};
				break;
			case 'month':
				this.dateOptions = {
					year: 'numeric',
					month: 'long',
				};
				break;
			case 'year':
				this.dateOptions = {
					year: 'numeric',
				};
				break;
		}
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
		const { locale = 'en-US' } = this.props;
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
					{ new Date( key ).toLocaleString( locale, this.dateOptions ) } ({ count })
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
