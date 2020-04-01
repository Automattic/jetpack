/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import { getSortOptions } from '../lib/sort';

export default class SearchSort extends Component {
	handleKeyPress = event => {
		if ( this.props.value !== event.target.value && event.key === 'Enter' ) {
			event.preventDefault();
			this.props.onChange( event.target.dataset.value );
		}
	};
	handleClick = event => {
		if ( this.props.value !== event.target.value ) {
			event.preventDefault();
			this.props.onChange( event.target.dataset.value );
		}
	};

	render() {
		const sortOptions = getSortOptions();
		return (
			<div className="jetpack-instant-search__box-filter-order">
				{ Object.keys( sortOptions ).map( sortKey => (
					<a
						class={ `jetpack-instant-search__box-filter-option ${
							this.props.value === sortKey ? 'is-selected' : ''
						}` }
						data-value={ sortKey }
						key={ sortKey }
						onClick={ this.handleClick }
						onKeyPress={ this.handleKeyPress }
						role="button"
						tabIndex={ 0 }
					>
						{ sortOptions[ sortKey ].label }
					</a>
				) ) }
			</div>
		);
	}
}
