/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
//import './style.scss';

/**
 * The Section component.
 *
 * @param {object} props         The properties.
 * @param {string} props.title   The section title.
 * @param {array} props.children The section title.
 * @returns {JSX.Element}        The Section component.
 */
export default function Section( props ) {
	const { title, children } = props;

	return (
		<div className="jetpack-cui__section">
			<h2>{ title }</h2>

			{ children && <div className="jetpack-cui__section-body">{ children }</div> }
		</div>
	);
}
