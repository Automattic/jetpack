import clsx from 'clsx';
import React from 'react';
import styles from './style.module.scss';
import type { AdminSectionBaseProps } from '../types';

/**
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {AdminSectionBaseProps} props - Component properties.
 * @returns {React.Component} AdminSectionHero component.
 */
const AdminSectionHero: React.FC< AdminSectionBaseProps > = ( { children, className } ) => {
	return <div className={ clsx( styles[ 'section-hero' ], className ) }>{ children }</div>;
};

export default AdminSectionHero;
