/**
 * External dependencies
 */
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { solidIcon, outlinedIcon } from './icons';

/**
 * Style dependencies
 */
import './style.scss';

const MoneyBackGuarantee = ( { frequency, iconStyle, text } ) => {
	const classes = classNames(
		'jetpack-money-back-guarantee',
		`jetpack-money-back-guarantee--${ iconStyle }`
	);

	return (
		<div className={ classes }>
			<div className="jetpack-money-back-guarantee__icon">
				{ 'solid' === iconStyle && solidIcon() }
				{ 'outlined' === iconStyle && outlinedIcon() }

				<span className="jetpack-money-back-guarantee__frequency">
					{ 'monthly' === frequency && 7 }
					{ 'yearly' === frequency && 14 }
				</span>
			</div>

			<div className="jetpack-money-back-guarantee__text">{ text }</div>
		</div>
	);
};

MoneyBackGuarantee.propTypes = {
	frequency: PropTypes.string,
	iconStyle: PropTypes.string,
	text: PropTypes.string.isRequired,
};

MoneyBackGuarantee.defaultProps = {
	frequency: 'yearly',
	iconStyle: 'solid',
};

export { MoneyBackGuarantee };
