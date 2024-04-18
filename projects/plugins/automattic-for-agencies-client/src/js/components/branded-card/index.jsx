import { AutomatticForAgenciesLogo, AutomatticIconLogo } from '@automattic/jetpack-components';
import React from 'react';
import styles from './styles.module.scss';

/**
 * Branded Card component.
 *
 * @param {object} props                  - The component props.
 * @param {React.Element} props.children  - The component children.
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function BrandedCard( { children } ) {
	return (
		<div className={ styles.card }>
			<div className={ styles.card__column + ' ' + styles[ 'card__column--brand' ] }>
				<AutomatticIconLogo />
				<AutomatticForAgenciesLogo />
			</div>
			<div className={ styles.card__column + ' ' + styles[ 'card__column--content' ] }>
				{ children }
			</div>
		</div>
	);
}
