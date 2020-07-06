/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl, Button } from '@wordpress/components';
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import {
	GOOGLE_PHOTOS_CATEGORIES,
	GOOGLE_PHOTOS_DATE_PRESETS,
	DATE_RANGE_ANY,
} from '../../constants';

function CategoryOption( { value, updateFilter } ) {
	return (
		<SelectControl
			label={ __( 'Category', 'jetpack' ) }
			value={ value }
			options={ GOOGLE_PHOTOS_CATEGORIES }
			onChange={ updateFilter }
		/>
	);
}

function DateOption( { value, updateFilter } ) {
	return (
		<SelectControl
			label={ __( 'Filter by time period', 'jetpack' ) }
			value={ value?.range || DATE_RANGE_ANY }
			options={ GOOGLE_PHOTOS_DATE_PRESETS }
			onChange={ range => updateFilter( { range } ) }
		/>
	);
}

function FavoriteOption() {
	return <span>{ __( 'Favorites', 'jetpack' ) }</span>;
}

function MediaTypeOption( { value, updateFilter } ) {
	const options = [
		{ label: __( 'All', 'jetpack' ), value: '' },
		{ label: __( 'Images', 'jetpack' ), value: 'photo' },
		{ label: __( 'Videos', 'jetpack' ), value: 'video' },
	];

	return (
		<SelectControl
			label={ __( 'Type', 'jetpack' ) }
			value={ value }
			options={ options }
			onChange={ updateFilter }
		/>
	);
}

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

function FilterOption( { children, removeFilter, isRemovable = false } ) {
	return (
		<div className="jetpack-external-media-googlephotos-filter">
			{ children }

			{ !! isRemovable && (
				<Button onClick={ removeFilter } isSmall>
					{ __( 'Remove Filter', 'jetpack' ) }
				</Button>
			) }
		</div>
	);
}

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
