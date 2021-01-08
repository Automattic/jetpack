/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import './style.scss';
import Header from '../header';
import Section from '../section';
import Card from '../card';
import Refresh from '../refresh';
import Plugin from '../plugin';

/**
 * The Connection IU Admin App.
 *
 * @returns {JSX.Element} The header component.
 */
export default function Admin() {
	const plugins = useSelect( select => select( STORE_ID ).getPlugins(), [] );

	const isRequestInProgress = useSelect( select => select( STORE_ID ).isRequestInProgress(), [] );

	const { isActive, isRegistered, isRefreshing } = useSelect(
		select => select( STORE_ID ).getConnectionStatus(),
		[]
	);

	return (
		<React.Fragment>
			<Header />

			<Section title={ __( 'Refresh Connection', 'jetpack' ) }>
				<Card>
					<Refresh />
				</Card>
			</Section>

			<Section
				title={ __( 'Manage Connections', 'jetpack' ) }
				faded={ ! isActive || ! isRegistered || isRefreshing }
			>
				{ plugins.map( plugin => (
					<Card>
						<Plugin plugin={ plugin } siteConnected={ isActive && isRegistered } />
					</Card>
				) ) }
			</Section>
		</React.Fragment>
	);
}
