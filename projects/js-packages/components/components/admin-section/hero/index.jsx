import React from 'react';
import styles from './style.module.scss';

/**
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminSectionHero component.
 */
const AdminSectionHero = props => {
	const { children } = props;
	return <div className={ styles[ 'section-hero' ] }>{ children }</div>;
};

export default AdminSectionHero;
