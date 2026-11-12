import clsx from 'clsx';
import LoadingBlock from '../loading-block';
import styles from './style.module.scss';

/**
 * Card-shaped placeholder for an upsell whose product, and so its title, is not known yet.
 *
 * @param {object} props             - Component props.
 * @param {string} [props.className] - Extra class for the card.
 * @return {object} ProductDetailCardSkeleton component.
 */
export default function ProductDetailCardSkeleton( { className } ) {
	return (
		<div className={ clsx( styles.card, styles[ 'skeleton-card' ], className ) } aria-busy="true">
			{ /* Sized to roughly match the Pro card, the usual offer, so the page does not jump when it loads. */ }
			<div className={ styles.container }>
				<LoadingBlock width="32px" height="32px" spaceBelow />
				<LoadingBlock width="50%" height="40px" spaceBelow />
				<LoadingBlock width="100%" height="50px" spaceBelow />
				<LoadingBlock width="100%" height="500px" spaceBelow />
				<LoadingBlock width="100%" height="70px" spaceBelow />
				<LoadingBlock width="100%" height="70px" spaceBelow />
				<LoadingBlock width="100%" height="42px" />
			</div>
		</div>
	);
}
