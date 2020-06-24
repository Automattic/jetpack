/**
 * External dependencies
 */
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { SelectControl, Button, DateTimePicker, Dropdown } from '@wordpress/components';
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import { GOOGLE_PHOTOS_CATEGORIES } from '../../constants';
import { getDateValue, getDateName } from './date-formatting';

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

function DateOption( { value, name, updateFilter } ) {
	const settings = __experimentalGetSettings();
	const update = ( selected, onToggle ) => {
		onToggle();
		updateFilter( selected );
	};

	return (
		<Dropdown
			position="bottom left"
			renderToggle={ ( { onToggle } ) => (
				<Button onClick={ onToggle } isTertiary>
					{ value
						? getDateValue( name, dateI18n( settings.formats.date, value ) )
						: getDateName( name ) }
				</Button>
			) }
			renderContent={ ( { onToggle } ) => (
				<div className="jetpack-external-media-header__dropdown">
					<DateTimePicker
						onChange={ selected => update( selected, onToggle ) }
						currentDate={ value }
					/>
				</div>
			) }
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

	if ( optionName === 'startDate' || optionName === 'endDate' ) {
		return <DateOption value={ optionValue } name={ optionName } updateFilter={ updateFilter } />;
	}

	if ( optionName === 'favorite' ) {
		return <FavoriteOption value={ optionValue } />;
	}

	if ( optionName === 'mediaType' ) {
		return <MediaTypeOption value={ optionValue } updateFilter={ updateFilter } />;
	}

	return null;
}

function FilterOption( { children, removeFilter } ) {
	return (
		<div className="jetpack-external-media-googlephotos-filter">
			{ children }

			<Button onClick={ removeFilter } isSmall>
				{ __( 'Remove Filter', 'jetpack' ) }
			</Button>
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
