import { useState } from '@wordpress/element';
import { SearchInput } from './search-input';
import './style.scss';

const SearchForm = ( { onSearch, initialValue, loading } ) => {
	const [ searchText, setSearchText ] = useState( initialValue );
	return (
		<div className="jp-forms__actions-search">
			<SearchInput
				onChange={ setSearchText }
				onSearch={ onSearch }
				value={ searchText }
				loading={ loading }
			/>
		</div>
	);
};

export default SearchForm;
