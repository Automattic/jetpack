/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Text, Title } from '@automattic/jetpack-components';
import { Icon, wordpress, plugins, color, shield } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import useProtectData from '../../hooks/use-protect-data';

const Cards = ( { name, vulnerabilities, icon } ) => {
	return (
		<Col lg={ 2 } className={ styles.card }>
			{ icon && <Icon icon={ icon } /> }
			<Text variant="label">{ name }</Text>
			<Text variant="body-extra-small">Vulnerabilities</Text>
			<Text variant="headline-small">{ vulnerabilities }</Text>
		</Col>
	);
};

const Summary = () => {
	const { core, numThemesVulnerabilities, numPluginsVulnerabilities } = useProtectData();
	const coreCount = core.vulnerabilities?.length || 0;
	return (
		<Container fluid>
			<Col lg={ 6 }>
				<Title size="small" className={ styles.title }>
					<Icon icon={ shield } size={ 32 } className={ styles.icon } />
					Last check
				</Title>
				<Text variant="headline-small" component="h1">
					Today, 4:43PM
				</Text>
			</Col>
			<Cards name="WordPress" vulnerabilities={ coreCount } icon={ wordpress } />
			<Cards name="Plugins" vulnerabilities={ numPluginsVulnerabilities } icon={ plugins } />
			<Cards name="Themes" vulnerabilities={ numThemesVulnerabilities } icon={ color } />
		</Container>
	);
};

export default Summary;
