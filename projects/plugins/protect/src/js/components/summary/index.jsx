import { Container, Col, Text, Title, getIconBySlug } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import useProtectData from '../../hooks/use-protect-data';
import styles from './styles.module.scss';

const Summary = () => {
	const { numThreats, lastChecked } = useProtectData();
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
				{ numThreats > 0 && (
					<Text variant="headline-small" component="h1">
						{ sprintf(
							/* translators: %s: Total number of threats  */
							__( '%s threats found', 'jetpack-protect' ),
							numThreats
						) }
					</Text>
				) }
			</Col>
		</Container>
	);
};

export default Summary;
