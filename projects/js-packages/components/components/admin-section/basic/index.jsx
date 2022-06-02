import React from 'react';
import styles from './style.module.scss';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSection component.
 */
const AdminSection = props => {
	const { children } = props;
	return <div className={ styles.section }>{ children }</div>;
};

export default AdminSection;
