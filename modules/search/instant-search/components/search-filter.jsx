/** @jsx h */

/**
 * External dependencies
 */
import { h, createRef, Component } from 'preact';
import strip from 'strip';
// eslint-disable-next-line lodash/import-scope
import uniqueId from 'lodash/uniqueId';

/**
 * Internal dependencies
 */
import { getCheckedInputNames } from '../lib/dom';

function getDateOptions( interval ) {
	switch ( interval ) {
		case 'day':
			return { year: 'numeric', month: 'long', day: 'numeric' };
		case 'month':
			return { year: 'numeric', month: 'long' };
		case 'year':
			return { year: 'numeric' };
	}
	return { year: 'numeric', month: 'long' };
}

export default class SearchFilter extends Component {
	constructor( props ) {
		super( props );
		this.filtersList = createRef();
		this.idPrefix = uniqueId( 'jetpack-instant-search__filter-' );

		if ( this.props.type === 'date' ) {
			// NOTE: This assumes that the configuration never changes. It will break if we
			// ever adjust it dynamically.
			this.dateOptions = getDateOptions( this.props.configuration.interval );
		}
	}

	getIdentifier() {
		if ( this.props.type === 'postType' ) {
			return 'post_types';
		} else if ( this.props.type === 'date' ) {
			// (month || year)_(post_date || post_date_gmt || post_modified || post_modified_gmt )
			// Ex: month_post_date_gmt
			return `${ this.props.configuration.interval }_${ this.props.configuration.field }`;
		} else if ( this.props.type === 'taxonomy' ) {
			return this.props.configuration.taxonomy;
		}
	}

	isChecked( value ) {
		return this.props.value && this.props.value.includes( value );
	}

	toggleFilter = () => {
		this.props.onChange( this.getIdentifier(), getCheckedInputNames( this.filtersList.current ) );
	};

	renderDate = ( { key_as_string: key, doc_count: count } ) => {
		const { locale = 'en-US' } = this.props;
		return (
			<div>
				<input
					checked={ this.isChecked( key ) }
					id={ `${ this.idPrefix }-dates-${ this.getIdentifier() }-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
				/>
				<label htmlFor={ `${ this.idPrefix }-dates-${ this.getIdentifier() }-${ key }` }>
					{ new Date( key ).toLocaleString( locale, this.dateOptions ) } ({ count })
				</label>
			</div>
		);
	};

	renderPostType = ( { key, doc_count: count } ) => {
		const name = key in this.props.postTypes ? this.props.postTypes[ key ].singular_name : key;
		return (
			<div>
				<input
					checked={ this.isChecked( key ) }
					id={ `${ this.idPrefix }-post-types-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
				/>
				<label htmlFor={ `${ this.idPrefix }-post-types-${ key }` }>
					{ strip( name ) } ({ count })
				</label>
			</div>
		);
	};

	renderTaxonomy = ( { key, doc_count: count } ) => {
		return (
			<div>
				<input
					checked={ this.isChecked( key ) }
					id={ `${ this.idPrefix }-taxonomies-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
				/>
				<label htmlFor={ `${ this.idPrefix }-taxonomies-${ key }` }>
					{ strip( key ) } ({ count })
				</label>
			</div>
		);
	};

	renderDates() {
		return (
			[
				...this.props.aggregation.buckets
					// TODO: Remove this filter; API should only be sending buckets with document counts.
					.filter( bucket => !! bucket && bucket.doc_count > 0 )
					.map( this.renderDate ),
			]
				// TODO: Remove this reverse & slice when API adds filter count support
				.reverse()
				.slice( 0, this.props.configuration.count )
		);
	}

	renderPostTypes() {
		return this.props.aggregation.buckets.map( this.renderPostType );
	}

	renderTaxonomies() {
		return this.props.aggregation.buckets.map( this.renderTaxonomy );
	}

	render() {
		return (
			<div>
				<h4 className="jetpack-search-filters-widget__sub-heading">
					{ this.props.configuration.name }
				</h4>
				{ this.props.aggregation && 'buckets' in this.props.aggregation && (
					<div className="jetpack-search-filters-widget__filter-list" ref={ this.filtersList }>
						{ this.props.type === 'date' && this.renderDates() }
						{ this.props.type === 'postType' && this.renderPostTypes() }
						{ this.props.type === 'taxonomy' && this.renderTaxonomies() }
					</div>
				) }
			</div>
		);
	}
}
