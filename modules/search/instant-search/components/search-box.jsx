/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

class SearchBox extends Component {
	render() {
		const { query, onChangeQuery, appRef, onFocus, onBlur, onKeyPress } = this.props;

		return (
			<div className={ 'jp-instant-search__box' }>
				{ /* TODO: Add support for preserving label text */ }
				<span className="screen-reader-text">{ __( 'Search', 'jetpack' ) }</span>
				<input
					className="search-field jp-instant-search__box-input"
					onInput={ onChangeQuery }
					onFocus={ onFocus }
					onBlur={ onBlur }
					ref={ appRef }
					placeholder={ __( 'Search…', 'jetpack' ) }
					type="search"
					value={ query }
				/>
			</div>
		);
	}
}

export default SearchBox;
