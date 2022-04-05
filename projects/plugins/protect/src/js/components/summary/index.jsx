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
			<Cards name="WordPress" vulnerabilities={ 3 } icon={ wordpress } />
			<Cards name="Plugins" vulnerabilities={ 5 } icon={ plugins } />
			<Cards name="Themes" vulnerabilities={ 10 } icon={ color } />
		</Container>
	);
};

export default Summary;
