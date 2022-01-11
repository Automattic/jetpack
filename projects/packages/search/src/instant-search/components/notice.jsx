/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import './notice.scss';

const Notice = ( { type, children } ) => {
	if ( type !== 'warning' ) {
		return null;
	}

	return (
		<div className="jetpack-instant-search__notice jetpack-instant-search__notice--warning">
			<Gridicon icon="info" size={ 20 } />
			{ children }
		</div>
	);
};

export default Notice;
