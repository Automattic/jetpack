/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import { SORT_OPTIONS } from '../lib/constants';

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

	render() {
		return (
			<div className="jetpack-instant-search__box-filter-order">
				{ [ ...SORT_OPTIONS.entries() ].map( ( [ sortKey, label ] ) => (
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
						{ label }
					</a>
				) ) }
			</div>
		);
	}
}
