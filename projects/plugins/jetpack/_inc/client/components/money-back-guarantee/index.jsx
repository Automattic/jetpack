/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { yearlyMoneyBackBadge } from './icons';

/**
 * Style dependencies
 */
import './style.scss';

const MoneyBackGuarantee = ( { text } ) => {
	return (
		<div className="jetpack-money-back-guarantee">
			<div className="jetpack-money-back-guarantee__icon">{ yearlyMoneyBackBadge }</div>

			<div className="jetpack-money-back-guarantee__text">{ text }</div>
		</div>
	);
};

MoneyBackGuarantee.propTypes = {
	text: PropTypes.string.isRequired,
};

export { MoneyBackGuarantee };
