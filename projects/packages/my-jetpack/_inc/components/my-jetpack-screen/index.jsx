/**
 * External dependencies
 */
import React from 'react';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { Icon, warning, info } from '@wordpress/icons';
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
import ConnectionsSection from '../connections-section';
import PlansSection from '../plans-section';
import ProductCardsSection from '../product-cards-section';
import useAnalytics from '../../hooks/use-analytics';
import useNoticeWatcher, { useGlobalNotice } from '../../hooks/use-notice';
import './style.scss';

/**
 * Component that renders the My Jetpack global notices.
 *
 * @returns {object} The GlobalNotice component.
 */
function GlobalNotice() {
	// Watch global events.
	useNoticeWatcher();

	/*
	 * Map Notice statuses with Icons.
	 * `success`, `info`, `warning`, `error`
	 */
	const iconMap = {
		error: warning,
		info,
	};

	const { message, options, clean } = useGlobalNotice();
	if ( ! message ) {
		return null;
	}

	return (
		<Notice { ...options } onRemove={ clean }>
			{ iconMap?.[ options.status ] && <Icon icon={ iconMap[ options.status ] } /> }
			<div className="components-notice__message-content">{ message }</div>
		</Notice>
	);
}

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
							<GlobalNotice />
						</Col>
					</Row>
					<Row>
						<Col lg={ 12 } md={ 8 } sm={ 4 }>
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
