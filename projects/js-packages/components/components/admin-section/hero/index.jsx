/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import Container from '../../layout/container';

/**
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSectionHero component.
 */
const AdminSectionHero = props => {
	const { children } = props;
	return (
		<div className={ styles[ 'jp-admin-section-hero' ] }>
			<Container>{ children }</Container>
		</div>
	);
};

export default AdminSectionHero;
