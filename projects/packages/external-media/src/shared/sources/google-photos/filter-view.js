import { SelectControl, Button } from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';

const FILTERS = [
	{ label: __( 'Category', 'jetpack-external-media' ), value: 'category' },
	{ label: __( 'Date', 'jetpack-external-media' ), value: 'date' },
	{ label: __( 'Favorites', 'jetpack-external-media' ), value: 'favorite' },
	{ label: __( 'Media Type', 'jetpack-external-media' ), value: 'mediaType' },
];

/**
 * Get filter options
 *
 * @param {Array} filters - The filters
 * @return {Array} - The filters
 */
function getFilterOptions( filters ) {
	return FILTERS.filter( item => filters[ item.value ] === undefined );
}

/**
 * To remove the media type
 *
 * @param {Array}   filters     - The filters
 * @param {boolean} canUseMedia - Whether the media can be used
 * @return {Array}              - The filters
 */
function removeMediaType( filters, canUseMedia ) {
	if ( canUseMedia ) {
		return filters;
	}

	return filters.filter( item => item.value !== 'mediaType' );
}

/**
 * Get first filter
 *
 * @param {Array} filters - The filters
 * @return {string} - The first filter
 */
function getFirstFilter( filters ) {
	const filtered = getFilterOptions( filters );

	if ( filtered.length > 0 ) {
		return filtered[ 0 ].value;
	}

	return '';
}

/**
 * Add filter
 *
 * @param {object} existing  - The current filters
 * @param {string} newFilter - The new filter
 * @return {string} - The filters
 */
function addFilter( existing, newFilter ) {
	return {
		...existing,
		[ newFilter ]: newFilter === 'favorite' ? true : '',
	};
}

/**
 * GoogleFilterView component
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX Element
 */
function GoogleFilterView( props ) {
	const [ currentFilter, setCurrentFilter ] = useState( getFirstFilter( [] ) );
	const { isLoading, isCopying, filters, canChangeMedia } = props;
	const remainingFilters = removeMediaType( getFilterOptions( filters ), canChangeMedia );
	const setFilter = () => {
		const newFilters = addFilter( filters, currentFilter );

		props.setFilters( newFilters );
		setCurrentFilter( getFirstFilter( newFilters ) );
	};

	if ( remainingFilters.length === 0 ) {
		return null;
	}

	return (
		<Fragment>
			<SelectControl
				label={ __( 'Filters', 'jetpack-external-media' ) }
				value={ currentFilter }
				disabled={ isLoading || isCopying }
				options={ remainingFilters }
				onChange={ setCurrentFilter }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>

			<Button disabled={ isLoading || isCopying } variant="secondary" isSmall onClick={ setFilter }>
				{ __( 'Add Filter', 'jetpack-external-media' ) }
			</Button>
		</Fragment>
	);
}

export default GoogleFilterView;
