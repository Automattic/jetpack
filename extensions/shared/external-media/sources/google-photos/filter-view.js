/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress/element';
import { SelectControl, Button } from '@wordpress/components';

const FILTERS = [
	{ label: __( 'Category', 'jetpack' ), value: 'category' },
	{ label: __( 'After date', 'jetpack' ), value: 'startDate' },
	{ label: __( 'Before date', 'jetpack' ), value: 'endDate' },
	{ label: __( 'Favorites', 'jetpack' ), value: 'favorite' },
	{ label: __( 'Media Type', 'jetpack' ), value: 'mediaType' },
];

function getFilterOptions( filters ) {
	return FILTERS.filter( item => filters[ item.value ] === undefined );
}

function removeMediaType( filters, canUseMedia ) {
	if ( canUseMedia ) {
		return filters;
	}

	return filters.filter( item => item.value !== 'mediaType' );
}

function getFirstFilter( filters ) {
	const filtered = getFilterOptions( filters );

	if ( filtered.length > 0 ) {
		return filtered[ 0 ].value;
	}

	return '';
}

function addFilter( existing, newFilter ) {
	return {
		...existing,
		[ newFilter ]: newFilter === 'favorite' ? true : '',
	};
}

function GoogleFilterView( props ) {
	const [ currentFilter, setCurrentFilter ] = useState( getFirstFilter( [] ) );
	const { isLoading, filters, canChangeMedia } = props;
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
				label={ __( 'Filters', 'jetpack' ) }
				value={ currentFilter }
				disabled={ isLoading }
				options={ remainingFilters }
				onChange={ setCurrentFilter }
			/>

			<Button disabled={ isLoading } isSecondary isSmall onClick={ setFilter }>
				{ __( 'Add Filter', 'jetpack' ) }
			</Button>
		</Fragment>
	);
}

export default GoogleFilterView;
