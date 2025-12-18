import * as React from 'react';
import { Component, createRef } from 'react';
import SearchBox from './search-box';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	constructor( props ) {
		super( props );
		this.searchInputRef = createRef();
	}

	onClear = () => this.props.onChangeSearch( '' );
	onChangeSearch = event => {
		// Safari's "Use advanced tracking and fingerprinting protection" privacy setting
		// can block access to event.currentTarget.value, returning empty/undefined.
		// In such cases, fall back to reading the value directly from the input element via ref.
		let value;
		try {
			value = event.currentTarget.value;
			// Check if the value is actually accessible (Safari may return empty string when blocked)
			if ( value === undefined || value === null ) {
				throw new Error( 'Event value blocked by browser privacy settings' );
			}
		} catch {
			// Fallback to ref when event.currentTarget.value is blocked
			value = this.searchInputRef.current?.value ?? '';
		}
		this.props.onChangeSearch( value );
	};

	render() {
		return (
			<form autoComplete="off" onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						ref={ this.searchInputRef }
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
