import { Icon, chevronLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

import './style.scss';

const BackButton = () => {
	const onBackClick = useCallback( () => history.back(), [] );

	return (
		<button className="jp-recommendations-back-btn" onClick={ onBackClick }>
			<Icon icon={ chevronLeft } size={ 18 } />
			{
				/* translators: As in go back to the previous page. */
				__( 'Back', 'jetpack' )
			}
		</button>
	);
};

export default BackButton;
