/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, Button, Title, IconsCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Footer = ( { handleProductButton, learnMoreUrl } ) => {
	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 0 } fluid={ false }>
			<Col>
				<IconsCard products={ [ 'backup', 'scan', 'anti-spam' ] } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<Title>{ __( 'Comprehensive Site Security', 'jetpack-protect' ) }</Title>
				<Text className={ styles.paragraphs }>
					{ __(
						'Jetpack Security offers advanced scan tools, including one-click fixes for most threats and malware scanning. Plus, with this bundle you also get real-time cloud backups and spam protection.',
						'jetpack-protect'
					) }
				</Text>
				<Button variant="secondary" onClick={ handleProductButton }>
					{ __( 'Get Jetpack Security', 'jetpack-protect' ) }
				</Button>
			</Col>
			<Col sm={ 0 } md={ 0 } lg={ 1 }></Col>
			<Col sm={ 4 } md={ 3 } lg={ 5 }>
				<Title>{ __( 'Over 22,000 listed vulnerabilities', 'jetpack-protect' ) }</Title>
				<Text className={ styles.paragraphs }>
					{ __(
						'Every day we check your plugin, theme, and WordPress versions against our 22,000 listed vulnerabilities powered by WPScan, an Automattic brand.',
						'jetpack-protect'
					) }
				</Text>
				<Button variant="external-link" href={ learnMoreUrl }>
					{ __( 'Learn more', 'jetpack-protect' ) }
				</Button>
			</Col>
		</Container>
	);
};

Footer.propTypes = {
	/** Callback to handle the add product button click. */
	handleProductButton: PropTypes.func,
	/** Urt of the Learn More link. */
	learnMoreUrl: PropTypes.string,
};

export default Footer;
