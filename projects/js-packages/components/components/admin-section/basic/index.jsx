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
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSection component.
 */
const AdminSection = props => {
	const { children } = props;
	return (
		<div className={ styles[ 'jp-admin-section' ] }>
			<Container>{ children }</Container>
		</div>
	);
};

export default AdminSection;
