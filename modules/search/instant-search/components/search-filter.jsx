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

// TODO: Fix this in the API
// TODO: Remove once format is fixed in the API
function fixDateFormat( dateString ) {
	return dateString.split( ' ' ).join( 'T' );
}

export default class SearchFilter extends Component {
	filtersList = createRef();
	idPrefix = uniqueId( 'jetpack-instant-search__filter-' );

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
					className="jetpack-instant-search__filter-list-input"
				/>
				<label
					htmlFor={ `${ this.idPrefix }-dates-${ this.getIdentifier() }-${ key }` }
					className="jetpack-instant-search__filter-list-label"
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
					id={ `${ this.idPrefix }-post-types-${ key }` }
					name={ key }
					onChange={ this.toggleFilter }
					type="checkbox"
					className="jetpack-instant-search__filter-list-input"
				/>
				<label
					htmlFor={ `${ this.idPrefix }-post-types-${ key }` }
					className="jetpack-instant-search__filter-list-label"
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
					id={ `${ this.idPrefix }-taxonomies-${ slug }` }
					name={ slug }
					onChange={ this.toggleFilter }
					type="checkbox"
					className="jetpack-instant-search__filter-list-input"
				/>

				<label
					htmlFor={ `${ this.idPrefix }-taxonomies-${ slug }` }
					className="jetpack-instant-search__filter-list-label"
				>
					{ strip( name ) } ({ count })
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
				<h4 className="jetpack-instant-search__filter-sub-heading">
					{ this.props.configuration.name }
				</h4>
				{ this.props.aggregation && 'buckets' in this.props.aggregation && (
					<div className="jetpack-instant-search__filter-list" ref={ this.filtersList }>
						{ this.props.type === 'date' && this.renderDates() }
						{ this.props.type === 'postType' && this.renderPostTypes() }
						{ this.props.type === 'taxonomy' && this.renderTaxonomies() }
					</div>
				) }
			</div>
		);
	}
}
