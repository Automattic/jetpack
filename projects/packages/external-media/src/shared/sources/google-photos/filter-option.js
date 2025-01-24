import { NumberControl } from '@automattic/jetpack-components';
import { SelectControl, Button } from '@wordpress/components';
import { useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { omit } from 'lodash';
import React from 'react';
import {
	GOOGLE_PHOTOS_CATEGORIES,
	GOOGLE_PHOTOS_DATE_PRESETS,
	DATE_RANGE_ANY,
	DATE_RANGE_CUSTOM,
	MONTH_SELECT_OPTIONS,
	CURRENT_YEAR,
} from '../../constants';

/**
 * CategoryOption component
 *
 * @param {object}   props              - The component props
 * @param {string}   props.value        - The category
 * @param {Function} props.updateFilter - The function to update the filter
 * @return {React.ReactElement}         - JSX Element
 */
function CategoryOption( { value, updateFilter } ) {
	return (
		<SelectControl
			label={ __( 'Category', 'jetpack-external-media' ) }
			value={ value }
			options={ GOOGLE_PHOTOS_CATEGORIES }
			onChange={ updateFilter }
			__nextHasNoMarginBottom={ true }
		/>
	);
}

/**
 * DateOption component
 *
 * @param {object}   props              - The component props
 * @param {object}   props.value        - The date
 * @param {Function} props.updateFilter - The function to update the filter
 * @return {React.ReactElement}         - JSX Element
 */
function DateOption( { value, updateFilter } ) {
	const selectedRange = value?.range || DATE_RANGE_ANY;

	const [ month, setMonth ] = useState( -1 );
	const [ year, setYear ] = useState( CURRENT_YEAR );

	return (
		<div className="jetpack-external-media-date-filter">
			<SelectControl
				label={ __( 'Filter by time period', 'jetpack-external-media' ) }
				value={ selectedRange }
				options={ GOOGLE_PHOTOS_DATE_PRESETS }
				onChange={ range => updateFilter( { range } ) }
				__nextHasNoMarginBottom={ true }
			/>
			{ selectedRange === DATE_RANGE_CUSTOM && (
				<Fragment>
					<SelectControl
						label={ __( 'Month', 'jetpack-external-media' ) }
						value={ month }
						options={ MONTH_SELECT_OPTIONS }
						onChange={ setMonth }
						__nextHasNoMarginBottom={ true }
					/>
					<NumberControl
						className="components-base-control"
						label={ __( 'Year', 'jetpack-external-media' ) }
						value={ year }
						min={ 1970 }
						onChange={ setYear }
					/>
					<Button
						variant="secondary"
						disabled={ value?.month === month && value?.year === year }
						onClick={ () => updateFilter( { range: selectedRange, month, year } ) }
					>
						{ __( 'Apply', 'jetpack-external-media' ) }
					</Button>
				</Fragment>
			) }
		</div>
	);
}

/**
 * FavoriteOption component
 *
 * @return {React.ReactElement} - JSX Element
 */
function FavoriteOption() {
	return <span>{ __( 'Favorites', 'jetpack-external-media' ) }</span>;
}

/**
 * MediaTypeOption component
 *
 * @param {object}   props              - The component props
 * @param {object}   props.value        - The media type
 * @param {Function} props.updateFilter - The function to update the filter
 * @return {React.ReactElement}         - JSX Element
 */
function MediaTypeOption( { value, updateFilter } ) {
	const options = [
		{ label: __( 'All', 'jetpack-external-media' ), value: '' },
		{ label: __( 'Images', 'jetpack-external-media' ), value: 'photo' },
		{ label: __( 'Videos', 'jetpack-external-media' ), value: 'video' },
	];

	return (
		<SelectControl
			label={ __( 'Type', 'jetpack-external-media' ) }
			value={ value }
			options={ options }
			onChange={ updateFilter }
		/>
	);
}

/**
 * Get the filter option
 *
 * @param {string}   optionName   - The option name
 * @param {string}   optionValue  - The option value
 * @param {Function} updateFilter - The function to update the filter
 * @return {React.ReactElement}   - JSX Element
 */
function getFilterOption( optionName, optionValue, updateFilter ) {
	if ( optionName === 'category' ) {
		return <CategoryOption value={ optionValue } updateFilter={ updateFilter } />;
	}

	if ( optionName === 'date' ) {
		return <DateOption value={ optionValue } updateFilter={ updateFilter } />;
	}

	if ( optionName === 'favorite' ) {
		return <FavoriteOption value={ optionValue } />;
	}

	if ( optionName === 'mediaType' ) {
		return <MediaTypeOption value={ optionValue } updateFilter={ updateFilter } />;
	}

	return null;
}

/**
 * FilterOption component
 *
 * @param {object}          props              - The component props
 * @param {React.ReactNode} props.children     - The children
 * @param {boolean}         props.isRemovable  - Whether the filter is removable
 * @param {Function}        props.removeFilter - The function to remove the filter
 * @return {React.ReactElement}                - JSX Element
 */
function FilterOption( { children, removeFilter, isRemovable = false } ) {
	return (
		<div className="jetpack-external-media-googlephotos-filter">
			{ children }

			{ !! isRemovable && (
				<Button onClick={ removeFilter } isSmall>
					{ __( 'Remove Filter', 'jetpack-external-media' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * Get updated filters
 *
 * @param {object} existing - The current filters
 * @param {string} key      - The key of the filter
 * @param {string} value    - The value of the filter
 * @return {object}         - The updated filters
 */
function getUpdatedFilters( existing, key, value ) {
	const copy = {
		...existing,
		[ key ]: value,
	};

	// Some special exceptions
	if ( key === 'mediaType' && value === 'video' ) {
		delete copy.category;
	} else if ( key === 'category' && copy.mediaType === 'video' ) {
		delete copy.mediaType;
	}

	return copy;
}

/**
 * GoogleFilterOption component
 *
 * @param {object}   props                - The component props
 * @param {object}   props.filters        - The filters
 * @param {boolean}  props.canChangeMedia - Whether the media is changeable
 * @param {Function} props.setFilters     - The function to set the filters
 * @return {React.ReactElement}           - JSX Element
 */
function GoogleFilterOption( { filters, setFilters, canChangeMedia } ) {
	const options = Object.keys( filters )
		.filter( item => canChangeMedia || item !== 'mediaType' )
		.map( key => (
			<FilterOption key={ key } removeFilter={ () => setFilters( omit( filters, key ) ) }>
				{ getFilterOption( key, filters[ key ], value =>
					setFilters( getUpdatedFilters( filters, key, value ) )
				) }
			</FilterOption>
		) );

	if ( options.length === 0 ) {
		return null;
	}

	return options;
}

export default GoogleFilterOption;
