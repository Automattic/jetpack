/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

class SearchBox extends Component {
	render() {
		const { query, onChangeQuery, appRef, showIcon } = this.props;

		const cls = showIcon ? 'jp-instant-search__box-svg' : 'jp-instant-search__box';
		return (
			<label className={ cls }>
				{ /* TODO: Add support for preserving label text */ }
				<span className="screen-reader-text">{ __( 'Search' ) }</span>
				<input
					className="search-field jp-instant-search__box-input"
					onInput={ onChangeQuery }
					ref={ appRef }
					placeholder={ __( 'Search…' ) }
					type="search"
					value={ query }
				/>
			</label>
		);
	}
}

export default SearchBox;
