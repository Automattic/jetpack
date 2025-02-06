import Gridicon from 'components/gridicon';

const SearchCloseButton = ( { instanceId, closeSearch, closeListener } ) => {
	return (
		<div
			role="button"
			className="dops-search__icon-navigation"
			onClick={ closeSearch }
			tabIndex="0"
			onKeyDown={ closeListener }
			aria-controls={ 'dops-search-component-' + instanceId }
			aria-label="Close Search"
		>
			<Gridicon icon="cross" className="dops-search__close-icon" />
		</div>
	);
};

export default SearchCloseButton;
