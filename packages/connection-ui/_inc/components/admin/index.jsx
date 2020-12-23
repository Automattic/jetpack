/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Header from '../header';
import './style.scss';
import Section from '../section';

/**
 * The Connection IU Admin App.
 *
 * @returns {JSX.Element} The header component.
 */
export default function Admin() {
	return (
		<React.Fragment>
			<Header />

			<Section title="Refresh Connection" />
		</React.Fragment>
	);
}
