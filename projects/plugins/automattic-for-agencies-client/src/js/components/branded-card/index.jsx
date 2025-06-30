import { AutomatticForAgenciesLogo, AutomatticIconLogo } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

/**
 * Branded Card component.
 *
 * @param {object}                  props          - The component props.
 * @param {import('react').Element} props.children - The component children.
 * @return {import('react').Component} The `ConnectionCard` component.
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
