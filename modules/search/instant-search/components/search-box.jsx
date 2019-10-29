/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line lodash/import-scope
import uniqueId from 'lodash/uniqueId';

const SearchBox = props => {
	const [ inputId ] = useState( () => uniqueId( 'jp-instant-search__box-input-' ) );
	return (
		<div className={ 'jp-instant-search__box' }>
			{ /* TODO: Add support for preserving label text */ }
			<label htmlFor={ inputId } className="screen-reader-text">
				{ __( 'Site Search', 'jetpack' ) }
			</label>
			<input
				id={ inputId }
				className="search-field jp-instant-search__box-input"
				onInput={ props.onChangeQuery }
				onFocus={ props.onFocus }
				onBlur={ props.onBlur }
				ref={ props.appRef }
				placeholder={ __( 'Search…', 'jetpack' ) }
				type="search"
				value={ props.query }
			/>
			<button className="screen-reader-text">{ __( 'Search', 'jetpack' ) }</button>
		</div>
	);
};

export default SearchBox;
