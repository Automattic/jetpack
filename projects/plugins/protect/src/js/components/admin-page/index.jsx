/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import {
	AdminPage,
	AdminSectionHero,
	AdminSection,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import Summary from '../summary';
import VulnerabilitiesList from '../vulnerabilities-list';
import useProtectData from '../../hooks/use-protect-data';
import Interstitial from '../interstitial';

const Admin = () => {
	const { isRegistered } = useConnection( { skipUserConnection: true } );
	const { plugins, themes, core } = useProtectData();

	// Show interstital page when Jetpack is not connected.
	if ( ! isRegistered ) {
		return (
			<AdminPage
				moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
				showHeader={ false }
				showBackground={ false }
			>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<Interstitial />
					</Col>
				</Container>
			</AdminPage>
		);
	}

	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<Summary />
					</Col>
				</Container>
			</AdminSectionHero>
			<AdminSection>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<VulnerabilitiesList title="WordPress" list={ [ core ] } />
					</Col>
					<Col>
						<VulnerabilitiesList title="Plugins" list={ plugins } />
					</Col>
					<Col>
						<VulnerabilitiesList title="Themes" list={ themes } />
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default Admin;
