import React from 'react';
import AutomatticIconLogo from '../automattic-icon-logo';
import AutomatticTextLogo from '../automattic-text-logo';
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
				<AutomatticTextLogo />
			</div>
			<div className={ styles.card__column + ' ' + styles[ 'card__column--content' ] }>
				{ children }
			</div>
		</div>
	);
}
