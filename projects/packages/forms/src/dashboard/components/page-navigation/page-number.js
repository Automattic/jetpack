import { useCallback } from '@wordpress/element';
import classNames from 'classnames';

const PageNumber = ( { active, className, page, onSelect } ) => {
	const buttonClass = classNames( 'jp-forms__page-navigation-page-number', className, {
		'is-active': active,
	} );

	const selectPage = useCallback( () => onSelect( page ), [ page, onSelect ] );

	return (
		<button className={ buttonClass } onClick={ selectPage }>
			{ page }
		</button>
	);
};

export default PageNumber;
