/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../header';
import './style.scss';
import Section from '../section';
import Card from '../card';
import Refresh from '../refresh';

/**
 * The Connection IU Admin App.
 *
 * @returns {JSX.Element} The header component.
 */
export default function Admin() {
	return (
		<React.Fragment>
			<Header />

			<Section title={ __( 'Refresh Connection', 'jetpack' ) }>
				<Card>
					<Refresh />
				</Card>
			</Section>
		</React.Fragment>
	);
}
