/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import SearchBox from './search-box';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	onClear = () => this.props.onChangeSearch( '' );
	onChangeSearch = event => this.props.onChangeSearch( event.currentTarget.value );

	render() {
		return (
			<form autocomplete="off" onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						isVisible={ this.props.isVisible }
						onChange={ this.onChangeSearch }
						onClear={ this.onClear }
						shouldRestoreFocus
						searchQuery={ this.props.searchQuery }
					/>
				</div>
			</form>
		);
	}
}

export default SearchForm;
