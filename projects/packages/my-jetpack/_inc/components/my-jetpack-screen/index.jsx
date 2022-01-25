/**
 * External dependencies
 */
import React from 'react';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Row,
	Col,
} from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import './style.scss';
import ConnectionsSection from '../connections-section';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';
import useAnalytics from '../../hooks/use-analytics';

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
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>
					<Row>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
							<h1>
								{ __(
									'Manage your Jetpack plan and products all in one place',
									'jetpack-my-jetpack'
								) }
							</h1>
							<ProductCardsSection />
						</Col>
					</Row>
				</AdminSectionHero>

				<AdminSection>
					<Row>
						<Col lg={ 6 } sm={ 4 }>
							<PlansSection />
						</Col>
						<Col lg={ 6 } sm={ 4 }>
							<ConnectionsSection />
						</Col>
					</Row>
				</AdminSection>
			</AdminPage>
		</div>
	);
}
