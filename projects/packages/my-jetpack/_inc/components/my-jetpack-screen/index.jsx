/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { Icon, warning, info } from '@wordpress/icons';
import {
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
import useNoticeWatcher, { useGlobalNotice } from '../../hooks/use-notice';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './styles.module.scss';

const GlobalNotice = ( { message, options, clean } ) => {
	/*
	 * Map Notice statuses with Icons.
	 * `success`, `info`, `warning`, `error`
	 */
	const iconMap = {
		error: warning,
		info,
	};

	return (
		<Notice { ...options } onRemove={ clean }>
			{ iconMap?.[ options.status ] && <Icon icon={ iconMap[ options.status ] } /> }
			<div className="components-notice__message-content">{ message }</div>
		</Notice>
	);
};

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	useNoticeWatcher();
	const { message, options, clean } = useGlobalNotice();

	const {
		tracks: { recordEvent },
	} = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_page_view' );
	}, [ recordEvent ] );

	// No render when site is not connected.
	const { isSiteConnected } = useMyJetpackConnection( { redirect: true } );

	if ( ! isSiteConnected ) {
		return null;
	}

	return (
		<AdminPage>
			<AdminSectionHero>
				<Container horizontalSpacing={ 5 } horizontalGap={ message ? 3 : 6 }>
					<Col lg={ 6 }>
						<h1 className={ styles.heading }>
							{ __(
								'Manage your Jetpack plan and products all in one place',
								'jetpack-my-jetpack'
							) }
						</h1>
					</Col>
					{ message && (
						<Col>
							<GlobalNotice message={ message } options={ options } clean={ clean } />
						</Col>
					) }
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
	);
}
