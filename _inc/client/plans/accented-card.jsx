/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

const AccentedCard = props => {
	const { header, body } = props.children;

	return (
		<div className="accented-card">
			{ /* TODO: make the className dynamic */ }
			<div className={ classNames( 'accented-card__header', 'is-backup-daily-plan' ) }>
				{ header }
			</div>
			<div className="accented-card__body">{ body }</div>
		</div>
	);
};

export { AccentedCard };
