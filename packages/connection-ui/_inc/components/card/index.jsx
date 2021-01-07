/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The Section component.
 *
 * @param {object} props         The properties.
 * @param {array} props.children The section title.
 * @returns {JSX.Element}        The Section component.
 */
const Card = props => {
	const { children } = props;

	return (
		<div className="jetpack-cui__card">
			{ children && <div className="jetpack-cui__card-body">{ children }</div> }
		</div>
	);
};

export default Card;
