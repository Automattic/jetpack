/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

/**
 * Style dependencies
 */
import './style.scss';

const BackButton = () => {
	const onBackClick = useCallback( () => history.back(), [] );

	return (
		<button className="jp-recommendations-back-btn" onClick={ onBackClick }>
			<Gridicon size={ 18 } icon="arrow-left" />
			{ __( 'Back', 'jetpack' ) }
		</button>
	);
};

export default BackButton;
