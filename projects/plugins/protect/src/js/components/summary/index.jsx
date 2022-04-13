/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Container, Col, Text, Title } from '@automattic/jetpack-components';
import { Icon, wordpress, plugins, color, shield, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Cards = ( { name, vulnerabilities, icon } ) => {
	return (
		<Col lg={ 2 } className={ styles.card }>
			{ icon && <Icon icon={ icon } /> }
			<Text variant="label">{ name }</Text>
			<Text variant="body-extra-small">{ __( 'Vulnerabilities', 'jetpack-protect' ) }</Text>
			<Text variant="headline-small">{ vulnerabilities }</Text>
		</Col>
	);
};

const Summary = ( { wordpressVuls, pluginsVuls, themesVuls } ) => {
	const hasVuls = wordpressVuls + pluginsVuls + themesVuls > 0;

	return (
		<Container fluid>
			<Col lg={ 6 } className={ styles.latest }>
				<Title size="small" className={ styles.title }>
					<Icon icon={ shield } size={ 32 } className={ styles.icon } />
					{ __( 'Latest scan', 'jetpack-protect' ) }
				</Title>
				<Text variant="headline-small" component="h1">
					Today, 4:43PM
				</Text>
			</Col>
			{ hasVuls ? (
				<>
					<Cards
						name={ __( 'WordPress', 'jetpack-protect' ) }
						vulnerabilities={ wordpressVuls }
						icon={ wordpress }
					/>
					<Cards
						name={ __( 'Plugins', 'jetpack-protect' ) }
						vulnerabilities={ pluginsVuls }
						icon={ plugins }
					/>
					<Cards
						name={ __( 'Themes', 'jetpack-protect' ) }
						vulnerabilities={ themesVuls }
						icon={ color }
					/>
				</>
			) : (
				<Col lg={ 6 } className={ styles[ 'no-vul' ] }>
					<Text variant="headline-small" className={ styles[ 'no-vul-text' ] }>
						<Icon icon={ check } size={ 40 } className={ styles.icon } />
						{ __( 'No vulnerabilities found!', 'jetpack-protect' ) }
					</Text>
				</Col>
			) }
		</Container>
	);
};

Summary.propTypes = {
	wordpressVuls: PropTypes.number.isRequired,
	pluginsVuls: PropTypes.number.isRequired,
	themesVuls: PropTypes.number.isRequired,
};

export default Summary;
