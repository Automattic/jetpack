/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Container, Col, Text, H3, Button, getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const VulnerabilityItem = ( { name, version, vulnerabilities } ) => {
	return (
		<Container fluid className={ styles.item }>
			<Col lg={ 4 } className={ styles.name }>
				<Text variant="title-small">{ name }</Text>
				<Text variant="body-small">
					{
						/* translators: placeholder is version. */
						sprintf( __( 'Version %s', 'jetpack-protect' ), version )
					}
				</Text>
			</Col>
			<Col lg={ 8 }>
				{ vulnerabilities.map( vulnerability => (
					<div className={ styles.vulnerability } key={ vulnerability.id }>
						<Button
							href={ getRedirectUrl( 'jetpack-protect-vul-info', { path: vulnerability.id } ) }
							variant="external-link"
						>
							{ vulnerability.title }
						</Button>
						<Text>{ vulnerability.description }</Text>
						<Text variant="body-extra-small">
							{
								/* translators: placeholder is version. */
								sprintf( __( 'Fixed in %s', 'jetpack-protect' ), vulnerability.fixedIn )
							}
						</Text>
					</div>
				) ) }
			</Col>
		</Container>
	);
};

const VulnerabilitiesList = ( { title, list } ) => {
	return (
		<>
			<H3>{ title }</H3>
			{ list.map( item => (
				<VulnerabilityItem
					key={ item.name }
					name={ item.name }
					version={ item.version }
					vulnerabilities={ item.vulnerabilities }
				/>
			) ) }
		</>
	);
};

export default VulnerabilitiesList;
