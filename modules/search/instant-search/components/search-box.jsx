/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

class SearchBox extends Component {
	render() {
		const { query, onChangeQuery, appRef, showIcon = false } = this.props;

		return (
			<label className="jp-instant-search__box">
				{ /* TODO: Add support for preserving label text */ }
				<span className="screen-reader-text">__( 'Search' )</span>
				{ showIcon && <Gridicon icon="jetpack-search" size={ 32 } /> }
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
