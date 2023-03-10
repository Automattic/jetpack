import React from 'react';
import styles from './style.module.scss';
import type { AdminSectionBaseProps } from '../types';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {AdminSectionBaseProps} props - Component properties.
 * @returns {React.ReactNode} AdminSection component.
 */
const AdminSection: React.FC< AdminSectionBaseProps > = ( { children } ) => {
	return <div className={ styles.section }>{ children }</div>;
};

export default AdminSection;
