import {
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

const SearchInput = ( { onSearch, initialValue } ) => {
	const [ searchText, setSearchText ] = useState( initialValue );
	const handleSearch = useCallback(
		event => {
			event.preventDefault();
			onSearch( searchText );
		},
		[ searchText, onSearch ]
	);
	return (
		<form className="jp-forms__actions-form" onSubmit={ handleSearch }>
			<InputControl
				onChange={ setSearchText }
				value={ searchText }
				placeholder="Search responses"
				label="Search"
				hideLabelFromVision={ true }
			/>
		</form>
	);
};

export default SearchInput;
