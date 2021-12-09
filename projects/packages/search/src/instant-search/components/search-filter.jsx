/**
 * External dependencies
 */
import React, { createRef, Component } from 'react';
import strip from 'strip';
// eslint-disable-next-line lodash/import-scope
import uniqueId from 'lodash/uniqueId';

/**
 * Internal dependencies
 */
import { getCheckedInputNames } from '../lib/dom';

/**
 * Get date options given an interval.
 *
 * @param {string} interval - Duration interval.
 * @returns {object} - Object containing date options.
 */
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

// TODO: Fix this in the API
// TODO: Remove once format is fixed in the API
export const fixDateFormat = dateString => {
	return dateString.split( ' ' ).join( 'T' );
};

export default class SearchFilter extends Component {
	filtersList = createRef();
	idPrefix = uniqueId( 'jetpack-instant-search__search-filter-' );

	getIdentifier() {
		if ( this.props.type === 'postType' ) {
			return 'post_types';
		} else if ( this.props.type === 'date' ) {
			// (month || year)_(post_date || post_date_gmt || post_modified || post_modified_gmt )
			// Ex: month_post_date_gmt
			return `${ this.props.configuration.interval }_${ this.props.configuration.field }`;
		} else if ( this.props.type === 'taxonomy' ) {
			return this.props.configuration.taxonomy;
		} else if ( this.props.type === 'group' ) {
			return this.props.configuration.filter_id;
		}
	}

	isChecked( value ) {
		// If props.value is undefined, this will return undefined.
		// Typecast so that this method always returns a boolean.
		return Boolean( this.props.value && this.props.value.includes( value ) );
	}

	toggleFilter = () => {
		this.props.onChange( this.getIdentifier(), getCheckedInputNames( this.filtersList.current ) );
	};

	toggleStaticFilter = event => {
		this.props.onChange( this.getIdentifier(), event.target.value );
	};

	renderDate = ( { key_as_string: key, doc_count: count } ) => {
		const { locale = 'en-US' } = this.props;
		return (
			<div>
				<input
					checked={ this.isChecked( key ) }
					disabled={ ! this.isChecked( key ) && count === 0 }
					id={ `${ this.idPrefix }-dates-${ this.getIdentifier() }-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
					className="jetpack-instant-search__search-filter-list-input"
				/>
				<label
					htmlFor={ `${ this.idPrefix }-dates-${ this.getIdentifier() }-${ key }` }
					className="jetpack-instant-search__search-filter-list-label"
				>
					{ new Date( fixDateFormat( key ) ).toLocaleString(
						locale,
						getDateOptions( this.props.configuration.interval )
					) }{ ' ' }
					({ count })
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
					disabled={ ! this.isChecked( key ) && count === 0 }
					id={ `${ this.idPrefix }-post-types-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
					className="jetpack-instant-search__search-filter-list-input"
				/>
				<label
					htmlFor={ `${ this.idPrefix }-post-types-${ key }` }
					className="jetpack-instant-search__search-filter-list-label"
				>
					{ strip( name ) } ({ count })
				</label>
			</div>
		);
	};

	renderTaxonomy = ( { key, doc_count: count } ) => {
		// Taxonomy keys contain slug and name separated by a slash
		const [ slug, name ] = key && key.split( /\/(.+)/ );

		return (
			<div>
				<input
					checked={ this.isChecked( slug ) }
					disabled={ ! this.isChecked( slug ) && count === 0 }
					id={ `${ this.idPrefix }-taxonomies-${ slug }` }
					name={ slug }
					onChange={ this.toggleFilter }
					type="checkbox"
					className="jetpack-instant-search__search-filter-list-input"
				/>

				<label
					htmlFor={ `${ this.idPrefix }-taxonomies-${ slug }` }
					className="jetpack-instant-search__search-filter-list-label"
				>
					{ strip( name ) } ({ count })
				</label>
			</div>
		);
	};

	renderGroup = group => {
		return (
			<div>
				<input
					checked={ this.isChecked( group.value ) }
					id={ `${ this.idPrefix }-groups-${ group.value }` }
					name={ this.props.configuration.filter_id }
					onChange={ this.toggleStaticFilter }
					value={ group.value }
					type="radio"
					className="jetpack-instant-search__search-filter-list-input"
				/>
				<label
					htmlFor={ `${ this.idPrefix }-groups-${ group.value }` }
					className="jetpack-instant-search__search-filter-list-label"
				>
					{ group.name }
				</label>
			</div>
		);
	};

	renderDates() {
		return (
			[ ...this.props.aggregation.buckets.filter( bucket => !! bucket ).map( this.renderDate ) ]
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

	renderGroups() {
		return this.props.configuration.values.map( this.renderGroup );
	}

	render() {
		return (
			<div>
				<h4 className="jetpack-instant-search__search-filter-sub-heading">
					{ this.props.configuration.name }
				</h4>

				<div ref={ this.filtersList }>
					<div className="jetpack-instant-search__search-filter-list jetpack-instant-search__search-static-filter-list">
						{ this.props.type === 'group' && this.renderGroups() }
					</div>

					{ this.props.aggregation && 'buckets' in this.props.aggregation && (
						<div className="jetpack-instant-search__search-filter-list">
							{ this.props.type === 'date' && this.renderDates() }
							{ this.props.type === 'postType' && this.renderPostTypes() }
							{ this.props.type === 'taxonomy' && this.renderTaxonomies() }
						</div>
					) }
				</div>
			</div>
		);
	}
}
