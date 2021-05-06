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
	// TODO: Fix and re-enable.
	// const [ color, setColor ] = useEntityProp( 'root', 'site', 'jetpack_search_highlight_color' );
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
	const { saveEntityRecord } = useDispatch( 'core' );
	const saveEditedEntityRecords = () => {
		editedEntities && saveEntityRecord( 'root', 'site', editedEntities );
	};
	const hasEditedEntities = editedEntities && Object.keys( editedEntities ).length > 0;

	return (
		<Card>
			<h3>{ __( 'Search Configurator 1000', 'jetpack' ) }</h3>
			<SelectControl
				disabled={ ! site }
				label={ __( 'Theme', 'jetpack' ) }
				value={ theme }
				options={ [
					{ label: __( 'Light', 'jetpack' ), value: 'light' },
					{ label: __( 'Dark', 'jetpack' ), value: 'dark' },
				] }
				onChange={ setTheme }
			/>
			<SelectControl
				disabled={ ! site }
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
				disabled={ ! site }
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
				disabled={ ! site }
				label={ __( 'Overlay Trigger', 'jetpack' ) }
				value={ trigger }
				options={ [
					{ label: __( 'Open when the user starts typing', 'jetpack' ), value: 'immediate' },
					{ label: __( 'Open when results are available', 'jetpack' ), value: 'results' },
				] }
				onChange={ setTrigger }
			/>
			{ /* TODO: Fix the ColorPicker implementation */ }
			{ /* <ColorPicker color={ color } onChangeComplete={ value => setColor( value.hex ) } /> */ }
			<ToggleControl
				checked={ sortEnabled }
				disabled={ ! site }
				label={ __( 'Enable Sort', 'jetpack' ) }
				onChange={ setSortEnabled }
			/>
			<ToggleControl
				checked={ infiniteScroll }
				disabled={ ! site }
				label={ __( 'Enable Infinite Scroll', 'jetpack' ) }
				onChange={ setInfiniteScroll }
			/>
			<ToggleControl
				checked={ showLogo }
				disabled={ ! site }
				label={ __( "Show 'Powered by Jetpack'", 'jetpack' ) }
				onChange={ setShowLogo }
			/>
			<hr />
			<div>
				{ /* eslint-disable-next-line react/jsx-no-bind */ }
				<button disabled={ ! site || ! hasEditedEntities } onClick={ saveEditedEntityRecords }>
					Save
				</button>
			</div>
		</Card>
	);
}
