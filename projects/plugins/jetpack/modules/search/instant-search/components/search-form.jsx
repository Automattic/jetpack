/** @jsx h */

/**
 * External dependencies
 */
import { Component, h } from 'preact';

/**
 * Internal dependencies
 */
import SearchBox from './search-box';
import SearchSort from './search-sort';
import './search-form.scss';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	onChangeSearch = event => this.props.onChangeSearch( event.currentTarget.value );
	onChangeSort = sort => this.props.onChangeSort( sort );

	render() {
		return (
			<form autocomplete="off" onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						isVisible={ this.props.isVisible }
						onChange={ this.onChangeSearch }
						shouldRestoreFocus
						searchQuery={ this.props.searchQuery }
					/>

					<div className="jetpack-instant-search__search-form-controls">
						{ this.props.children }
						{ this.props.enableSort && (
							<SearchSort
								onChange={ this.onChangeSort }
								resultFormat={ this.props.resultFormat }
								value={ this.props.sort }
							/>
						) }
					</div>
				</div>
			</form>
		);
	}
}

export default SearchForm;
