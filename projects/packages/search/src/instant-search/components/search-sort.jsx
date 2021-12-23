/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSortOptions } from '../lib/sort';

import './search-sort.scss';

export default class SearchSort extends Component {
	handleKeyPress = event => {
		if ( this.props.value !== event.currentTarget.value && event.key === 'Enter' ) {
			event.preventDefault();
			this.props.onChange( event.currentTarget.dataset.value );
		}
	};

	handleClick = event => {
		if ( this.props.value !== event.currentTarget.value ) {
			event.preventDefault();
			this.props.onChange( event.currentTarget.dataset.value );
		}
	};

	handleSelectChange = event => {
		if ( this.props.value !== event.currentTarget.value ) {
			event.preventDefault();
			this.props.onChange( event.currentTarget.value );
		}
	};

	render() {
		const sortOptions = getSortOptions( this.props.resultFormat );

		// If there are more than 3 sort options, use a select
		if ( sortOptions.size > 3 ) {
			return (
				<div className="jetpack-instant-search__search-sort jetpack-instant-search__search-sort-with-select">
					<label htmlFor="jetpack-instant-search__search-sort-select">
						{ __( 'Sort:', 'jetpack-search-pkg' ) }
					</label>
					<select
						id="jetpack-instant-search__search-sort-select"
						onBlur={ this.handleSelectChange }
						onChange={ this.handleSelectChange }
					>
						{ [ ...sortOptions.entries() ].map( ( [ sortKey, label ] ) => (
							<option
								value={ sortKey }
								key={ sortKey }
								selected={ this.props.value === sortKey ? 'selected' : '' }
							>
								{ label }
							</option>
						) ) }
					</select>
				</div>
			);
		}

		return (
			<div className="jetpack-instant-search__search-sort jetpack-instant-search__search-sort-with-links">
				<div className="screen-reader-text">{ __( 'Sort by: ', 'jetpack-search-pkg' ) }</div>
				{ [ ...sortOptions.entries() ].map( ( [ sortKey, label ] ) => (
					<a
						className={ `jetpack-instant-search__search-sort-option ${
							this.props.value === sortKey ? 'is-selected' : ''
						}` }
						data-value={ sortKey }
						key={ sortKey }
						onClick={ this.handleClick }
						onKeyPress={ this.handleKeyPress }
						role="button"
						tabIndex={ 0 }
					>
						{ label }
					</a>
				) ) }
			</div>
		);
	}
}
