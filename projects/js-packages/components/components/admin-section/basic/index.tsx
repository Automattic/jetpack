import styles from './style.module.scss';
import type { AdminSectionBaseProps } from '../types.ts';
import type { ReactNode, FC } from 'react';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {AdminSectionBaseProps} props - Component properties.
 * @return {ReactNode} AdminSection component.
 */
const AdminSection: FC< AdminSectionBaseProps > = ( { children } ) => {
	return <div className={ styles.section }>{ children }</div>;
};

export default AdminSection;
