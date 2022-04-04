/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, H3 } from '@automattic/jetpack-components';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const RISKS_LEVELS = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
};

const RISKS_LABELS = {
	[ RISKS_LEVELS.LOW ]: 'Low',
	[ RISKS_LEVELS.MEDIUM ]: 'Medium',
	[ RISKS_LEVELS.HIGH ]: 'High',
};

const VulnerabilityRisk = ( { risk } ) => {
	const className = classNames( styles.risk, {
		[ styles.low ]: risk === RISKS_LEVELS.LOW,
		[ styles.medium ]: risk === RISKS_LEVELS.MEDIUM,
		[ styles.high ]: risk === RISKS_LEVELS.HIGH,
	} );

	return (
		<Text component="div" className={ className }>
			{ RISKS_LABELS[ risk ] }
		</Text>
	);
};

const VulnerabilityItem = ( { name, version, vulnerabilities } ) => {
	return (
		<Container fluid className={ styles.item }>
			<Col lg={ 4 } className={ styles.name }>
				<Text variant="title-small">{ name }</Text>
				<Text variant="body-small">Version { version }</Text>
			</Col>
			<Col lg={ 8 }>
				{ vulnerabilities.map( vulnerability => (
					<div className={ styles.vulnerability }>
						<VulnerabilityRisk risk={ vulnerability.risk } />
						<Text>{ vulnerability.description }</Text>
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
					name={ item.name }
					version={ item.version }
					vulnerabilities={ item.vulnerabilities }
				/>
			) ) }
		</>
	);
};

export default VulnerabilitiesList;
