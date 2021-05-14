/**
 * External dependencies
 */
import React from 'react';
import { Card, SelectControl, ToggleControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import normalizeColors from './normalize-colors';
import './style.scss';

/**
 * SearchDashboard component definition.
 *
 * @returns {React.Component} Search dashboard component.
 */
export default function SearchDashboard() {
	const site = useSelect( select => select( 'core' ).getSite() );

	const [ theme, setTheme ] = useEntityProp( 'root', 'site', 'jetpack_search_color_theme' );
	const [ resultFormat, setResultFormat ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_result_format'
	);
	const [ sort, setSort ] = useEntityProp( 'root', 'site', 'jetpack_search_default_sort' );
	const [ trigger, setTrigger ] = useEntityProp( 'root', 'site', 'jetpack_search_overlay_trigger' );
	const [ color, setColor ] = useEntityProp( 'root', 'site', 'jetpack_search_highlight_color' );
	const normalizedColor = normalizeColors( color );
	const [ sortEnabled, setSortEnabled ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_enable_sort'
	);
	const [ infiniteScroll, setInfiniteScroll ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_inf_scroll'
	);
	const [ showLogo, setShowLogo ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_show_powered_by'
	);

	const editedEntities = useSelect( select =>
		select( 'core' ).getEntityRecordEdits( 'root', 'site' )
	);
	const isSaving = useSelect( select => select( 'core' ).isSavingEntityRecord( 'root', 'site' ) );
	const { saveEntityRecord } = useDispatch( 'core' );
	const saveEditedEntityRecords = () => {
		editedEntities && saveEntityRecord( 'root', 'site', editedEntities );
	};
	const hasEditedEntities = editedEntities && Object.keys( editedEntities ).length > 0;
	const isLoading = ! site;

	return (
		<Card>
			<h3>{ __( 'Search Configuration', 'jetpack' ) }</h3>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Theme', 'jetpack' ) }
				value={ theme }
				options={ [
					{ label: __( 'Light', 'jetpack' ), value: 'light' },
					{ label: __( 'Dark', 'jetpack' ), value: 'dark' },
				] }
				onChange={ setTheme }
			/>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Result Format', 'jetpack' ) }
				value={ resultFormat }
				options={ [
					{ label: __( 'Minimal', 'jetpack' ), value: 'minimal' },
					{ label: __( 'Expanded (shows images)', 'jetpack' ), value: 'expanded' },
					{ label: __( 'Product (for WooCommerce stores)', 'jetpack' ), value: 'product' },
				] }
				onChange={ setResultFormat }
			/>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Sort', 'jetpack' ) }
				value={ sort }
				options={ [
					{ label: __( 'Relevance (recommended)', 'jetpack' ), value: 'relevance' },
					{ label: __( 'Newest first', 'jetpack' ), value: 'newest' },
					{ label: __( 'Oldest first', 'jetpack' ), value: 'oldest' },
				] }
				onChange={ setSort }
			/>
			<SelectControl
				disabled={ isLoading }
				label={ __( 'Overlay Trigger', 'jetpack' ) }
				value={ trigger }
				options={ [
					{ label: __( 'Open when the user starts typing', 'jetpack' ), value: 'immediate' },
					{ label: __( 'Open when results are available', 'jetpack' ), value: 'results' },
				] }
				onChange={ setTrigger }
			/>
			<div className="jetpack-search-color-inputs">
				<label htmlFor="jetpack-search-highlight-color">Search Highlight Color</label>
				<input
					type="color"
					id="jetpack-search-highlight-color"
					value={ normalizedColor }
					// eslint-disable-next-line react/jsx-no-bind
					onChange={ event => setColor( event.target.value ) }
				/>
				<input
					type="text"
					value={ isLoading ? __( 'Loading…', 'jetpack' ) : normalizedColor }
					disabled
				/>
			</div>
			<ToggleControl
				checked={ sortEnabled }
				disabled={ isLoading }
				label={ __( 'Enable Sort', 'jetpack' ) }
				onChange={ setSortEnabled }
			/>
			<ToggleControl
				checked={ infiniteScroll }
				disabled={ isLoading }
				label={ __( 'Enable Infinite Scroll', 'jetpack' ) }
				onChange={ setInfiniteScroll }
			/>
			<ToggleControl
				checked={ showLogo }
				disabled={ isLoading }
				label={ __( "Show 'Powered by Jetpack'", 'jetpack' ) }
				onChange={ setShowLogo }
			/>
			<hr />
			<div>
				<button
					disabled={ isLoading || ! hasEditedEntities || isSaving }
					/* eslint-disable-next-line react/jsx-no-bind */
					onClick={ saveEditedEntityRecords }
				>
					{ isSaving ? 'Saving...' : 'Save' }
				</button>
			</div>
		</Card>
	);
}
