/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, bug, cloud, shield } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Footer = () => {
	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 } fluid={ false }>
			<Col sm={ 4 } md={ 8 } lg={ 12 }>
				<Icon icon={ cloud } size={ 18 } />
				<Icon icon={ shield } size={ 18 } />
				<Icon icon={ bug } size={ 18 } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<Text variant="title-medium" className={ styles.titles }>
					{ __( 'Comprehensive Site Security', 'jetpack-protect' ) }
				</Text>
				<Text className={ styles.paragraphs }>
					{ __(
						'Jetpack Security offers advanced scan tools, including one-click fixes for most threats and malware scanning. Plus, with this bundle you also get real-time cloud backups and spam protection.',
						'jetpack-protect'
					) }
				</Text>
				<Button variant="secondary">{ __( 'Get Jetpack Security', 'jetpack-protect' ) }</Button>
			</Col>
			<Col sm={ 0 } md={ 0 } lg={ 1 }></Col>
			<Col sm={ 4 } md={ 3 } lg={ 5 }>
				<Text variant="title-medium" className={ styles.titles }>
					{ __( 'Over 22,000 listed vulnerabilities', 'jetpack-protect' ) }
				</Text>
				<Text className={ styles.paragraphs }>
					{ __(
						'Every day we check your plugin, theme, and WordPress versions against our 22,000 listed vulnerabilities powered by WPScan, an Automattic brand.',
						'jetpack-protect'
					) }
				</Text>
				<Button variant="external-link">{ __( 'Learn more', 'jetpack-protect' ) }</Button>
			</Col>
		</Container>
	);
};

export default Footer;
