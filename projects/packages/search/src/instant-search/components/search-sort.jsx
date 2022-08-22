import { __ } from '@wordpress/i18n';
import React, { Component } from 'react';
import { getSortOptions } from '../lib/sort';

import './search-sort.scss';

export default class SearchSort extends Component {
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
		const optionCount = sortOptions.size;
		let currentOption = 0;

		// If there are more than 3 sort options, use a select
		if ( sortOptions.size > 3 ) {
			return (
				<div
					aria-controls="jetpack-instant-search__search-results-content"
					className="jetpack-instant-search__search-sort jetpack-instant-search__search-sort-with-select"
				>
					<label htmlFor="jetpack-instant-search__search-sort-select">
						{ __( 'Sort:', 'jetpack-search-pkg' ) }
					</label>
					<select
						className="jetpack-instant-search__search-sort-select"
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
			<div
				aria-controls="jetpack-instant-search__search-results-content"
				className="jetpack-instant-search__search-sort jetpack-instant-search__search-sort-with-links"
			>
				<div className="screen-reader-text">{ __( 'Sort by: ', 'jetpack-search-pkg' ) }</div>
				{ [ ...sortOptions.entries() ].map( ( [ sortKey, label ] ) => (
					<>
						<button
							aria-current={ this.props.value === sortKey ? 'true' : 'false' }
							className={ `jetpack-instant-search__search-sort-option ${
								this.props.value === sortKey ? 'is-selected' : ''
							}` }
							data-value={ sortKey }
							key={ sortKey }
							onClick={ this.handleClick }
						>
							{ label }
						</button>
						{ ++currentOption < optionCount ? (
							<span aria-hidden="true" className="jetpack-instant-search__search-sort-separator">
								•
							</span>
						) : (
							''
						) }
					</>
				) ) }
			</div>
		);
	}
}
