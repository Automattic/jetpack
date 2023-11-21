import { __ } from '@wordpress/i18n';

const CloseButton = ( { onClick } ) => {
	const handleOnClick = event => {
		event.preventDefault();
		onClick();
	};

	return (
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
		<a href={ '#' } onClick={ handleOnClick } className="cross-close">
			<span className="screen-reader-text">{ __( 'Dismiss', 'jetpack-boost' ) }</span>
		</a>
	);
};

export default CloseButton;
