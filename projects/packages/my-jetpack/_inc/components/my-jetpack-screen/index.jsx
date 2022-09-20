import {
	AdminSection,
	AdminSectionHero,
	AdminPage,
	Container,
	Col,
	Text,
} from '@automattic/jetpack-components';
import { ConnectionErrorNotice } from '@automattic/jetpack-connection';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning, info } from '@wordpress/icons';
import React, { useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useConnectionWatcher from '../../hooks/use-connection-watcher';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useGlobalNotice from '../../hooks/use-notice';
import ConnectionsSection from '../connections-section';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';
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
		<Notice isDismissible={ false } { ...options } onRemove={ clean } className={ styles.notice }>
			{ iconMap?.[ options.status ] && <Icon icon={ iconMap[ options.status ] } /> }
			<div className={ styles.message }>{ message }</div>
		</Notice>
	);
};

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	useConnectionWatcher();
	const { message, options, clean } = useGlobalNotice();

	const { recordEvent } = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_page_view' );
	}, [ recordEvent ] );

	// No render when site is not connected.
	const { isSiteConnected } = useMyJetpackConnection();

	if ( ! isSiteConnected ) {
		return null;
	}

	return (
		<AdminPage>
			<AdminSectionHero>
				<Container horizontalSpacing={ 0 }>
					<Col>
						<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
					</Col>
				</Container>
				<Container horizontalSpacing={ 5 } horizontalGap={ message ? 3 : 6 }>
					<Col sm={ 4 } md={ 7 } lg={ 6 }>
						<Text variant="headline-small">
							{ __( 'Manage your Jetpack products', 'jetpack-my-jetpack' ) }
						</Text>
					</Col>
					<Col>
						<ConnectionErrorNotice />
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
