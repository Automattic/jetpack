/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, Title, getIconBySlug } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import useProtectData from '../../hooks/use-protect-data';

const Summary = () => {
	const { numVulnerabilities, lastChecked } = useProtectData();
	const Icon = getIconBySlug( 'protect' );

	return (
		<Container fluid>
			<Col>
				<Title size="small" className={ styles.title }>
					<Icon size={ 32 } className={ styles.icon } />
					{ sprintf(
						/* translators: %s: Latest check date  */
						__( 'Latest results as of %s', 'jetpack-protect' ),
						dateI18n( 'F jS', lastChecked )
					) }
				</Title>
				{ numVulnerabilities > 0 && (
					<Text variant="headline-small" component="h1">
						{ sprintf(
							/* translators: %s: Total number of vulnerabilities  */
							__( '%s vulnerabilities found', 'jetpack-protect' ),
							numVulnerabilities
						) }
					</Text>
				) }
			</Col>
		</Container>
	);
};

export default Summary;
