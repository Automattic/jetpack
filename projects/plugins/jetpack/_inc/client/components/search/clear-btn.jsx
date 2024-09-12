import { __ } from '@wordpress/i18n';

const SearchClearButton = ( { onClick } ) => {
	return (
		<button
			className="dops-search__clear-btn"
			onClick={ onClick }
			aria-label={ __( 'Clear search', 'jetpack' ) }
		>
			{ __( 'Clear', 'jetpack' ) }
		</button>
	);
};

export default SearchClearButton;
