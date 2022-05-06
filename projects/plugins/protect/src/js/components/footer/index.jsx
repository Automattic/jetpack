/**
 * External dependencies
 */
import React from 'react';
import {
	Container,
	Col,
	Text,
	Button,
	Title,
	IconsCard,
	getRedirectUrl,
	Dialog,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { SECURITY_BUNDLE } from '../admin-page';

const GetSecurityBundle = ( { onAdd, hasCheckoutStarted } ) => {
	return (
		<div className={ styles.section }>
			<Title>{ __( 'Comprehensive Site Security', 'jetpack-protect' ) }</Title>
			<Text className={ styles.paragraphs }>
				{ __(
					'Jetpack Security offers advanced scan tools, including one-click fixes for most threats and malware scanning. Plus, with this bundle you also get real-time cloud backups and spam protection.',
					'jetpack-protect'
				) }
			</Text>

			<Button variant="secondary" onClick={ onAdd } isLoading={ hasCheckoutStarted }>
				{ __( 'Get Jetpack Security', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const FooterInfo = () => {
	const learnMoreUrl = getRedirectUrl( 'jetpack-protect-footer-learn-more' );

	return (
		<div className={ styles.section }>
			<Title>{ __( 'Over 22,000 listed vulnerabilities', 'jetpack-protect' ) }</Title>
			<Text className={ styles.paragraphs }>
				{ __(
					'Every day we check your plugin, theme, and WordPress versions against our 22,000 listed vulnerabilities powered by WPScan, an Automattic brand.',
					'jetpack-protect'
				) }
			</Text>
			<Button variant="external-link" href={ learnMoreUrl } weight="regular">
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const Footer = () => {
	const { adminUrl } = window.jetpackProtectInitialState || {};

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: SECURITY_BUNDLE,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getSecurityBundle = recordEventHandler(
		'jetpack_protect_footer_get_security_link_click',
		run
	);

	return (
		<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
			<Col className={ styles.icons }>
				<Container horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ true }>
					<Col>
						<IconsCard products={ [ 'backup', 'scan', 'anti-spam' ] } />
					</Col>
				</Container>
			</Col>
			<Col>
				<Dialog
					primary={
						<GetSecurityBundle
							onAdd={ getSecurityBundle }
							hasCheckoutStarted={ hasCheckoutStarted }
						/>
					}
					secondary={ <FooterInfo /> }
					split={ true }
				/>
			</Col>
		</Container>
	);
};

export default Footer;
