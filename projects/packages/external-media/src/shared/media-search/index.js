import { SearchControl } from '@wordpress/components';
import { useDebouncedInput } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';

const MediaSearch = ( { defaultValue, onSearch } ) => {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput( defaultValue );
	const searchLabel = __( 'Search', 'jetpack-external-media' );

	useEffect( () => {
		onSearch( debouncedSearch );
	}, [ debouncedSearch, onSearch ] );

	return (
		<SearchControl
			__nextHasNoMarginBottom
			className="jetpack-external-media-search"
			onChange={ setSearch }
			value={ search }
			label={ searchLabel }
			placeholder={ searchLabel }
		/>
	);
};

export default MediaSearch;
