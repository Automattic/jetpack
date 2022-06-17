import { SelectControl, Button } from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const FILTERS = [
	{ label: __( 'Category', 'jetpack' ), value: 'category' },
	{ label: __( 'Date', 'jetpack' ), value: 'date' },
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
				label={ __( 'Filters', 'jetpack' ) }
				value={ currentFilter }
				disabled={ isLoading || isCopying }
				options={ remainingFilters }
				onChange={ setCurrentFilter }
			/>

			<Button disabled={ isLoading || isCopying } variant="secondary" isSmall onClick={ setFilter }>
				{ __( 'Add Filter', 'jetpack' ) }
			</Button>
		</Fragment>
	);
}

export default GoogleFilterView;
