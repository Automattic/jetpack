import styles from './style.module.scss';
import type { AdminSectionBaseProps } from '../types.ts';
import type { Component, FC } from 'react';

/**
 * The wrapper component for a Hero Section to be used in admin pages.
 *
 * @param {AdminSectionBaseProps} props - Component properties.
 * @return {Component} AdminSectionHero component.
 */
const AdminSectionHero: FC< AdminSectionBaseProps > = ( { children } ) => {
	return <div className={ styles[ 'section-hero' ] }>{ children }</div>;
};

export default AdminSectionHero;
