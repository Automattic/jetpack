import SearchInput from './search-input';
import './style.scss';

const SearchForm = ( { initialValue, loading, onSearch } ) => {
	return (
		<div className="jp-forms__actions-search">
			<SearchInput initialValue={ initialValue } loading={ loading } onSearch={ onSearch } />
		</div>
	);
};

export default SearchForm;
