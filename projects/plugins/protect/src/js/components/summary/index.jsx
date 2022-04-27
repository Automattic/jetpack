/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, shield } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import useProtectData from '../../hooks/use-protect-data';

const Summary = () => {
	const { numVulnerabilities, lastChecked } = useProtectData();
	return (
		<Container fluid>
			<Col>
				<Title size="small" className={ styles.title }>
					<Icon icon={ shield } size={ 32 } className={ styles.icon } />
					{ sprintf(
						/* translators: %s: Latest check date  */
						__( 'Latest results as of %s', 'jetpack-protect' ),
						dateI18n( 'F jS', lastChecked )
					) }
				</Title>
				<Text variant="headline-small" component="h1">
					{ sprintf(
						/* translators: %s: Total number of vulnerabilities  */
						__( '%s vulnerabilities found', 'jetpack-protect' ),
						numVulnerabilities
					) }
				</Text>
			</Col>
		</Container>
	);
};

export default Summary;
