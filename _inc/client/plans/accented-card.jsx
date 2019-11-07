/**
 * External dependencies
 */
import React from 'react';

const AccentedCard = props => {
	const { header, body } = props.children;

	return (
		<div className="accented-card">
			<div className={ 'accented-card__header' }>{ header }</div>
			<div className={ 'accented-card__body' }>{ body }</div>
		</div>
	);
};

export { AccentedCard };
