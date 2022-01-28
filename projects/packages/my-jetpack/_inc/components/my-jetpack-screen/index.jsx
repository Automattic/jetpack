/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import {
	ThemeProvider,
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Container,
	Col,
} from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectionsSection from '../connections-section';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';
import useAnalytics from '../../hooks/use-analytics';
import styles from './styles.module.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	const {
		tracks: { recordEvent },
	} = useAnalytics();
	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_page_view' );
	}, [ recordEvent ] );
	return (
		<ThemeProvider>
			<AdminPage>
				<AdminSectionHero>
					<Container horizontalSpacing={ 5 } horizontalGap={ 6 }>
						<Col>
							<h1 className={ styles.heading }>
								{ __(
									'Manage your Jetpack plan and products all in one place',
									'jetpack-my-jetpack'
								) }
							</h1>
						</Col>
						<Col>
							<ProductCardsSection />
						</Col>
					</Container>
				</AdminSectionHero>

				<AdminSection>
					<Container horizontalSpacing={ 8 }>
						<Col sm={ 2 } md={ 4 } lg={ 6 }>
							<PlansSection />
						</Col>
						<Col sm={ 2 } md={ 4 } lg={ 6 }>
							<ConnectionsSection />
						</Col>
					</Container>
				</AdminSection>
			</AdminPage>
		</ThemeProvider>
	);
}
