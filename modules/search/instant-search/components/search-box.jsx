/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

class SearchBox extends Component {
	render() {
		return (
			<div className={ 'jp-instant-search__box' }>
				{ /* TODO: Add support for preserving label text */ }
				<span className="screen-reader-text">{ __( 'Search', 'jetpack' ) }</span>
				<input
					className="search-field jp-instant-search__box-input"
					onInput={ this.props.onChangeQuery }
					onFocus={ this.props.onFocus }
					onBlur={ this.props.onBlur }
					ref={ this.props.appRef }
					placeholder={ __( 'Search…', 'jetpack' ) }
					type="search"
					value={ this.props.query }
				/>
			</div>
		);
	}
}

export default SearchBox;
