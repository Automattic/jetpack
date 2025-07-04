import { __ } from '@wordpress/i18n';
import { Icon, starFilled as star } from '@wordpress/icons';
import Text from '../text/index.tsx';
import styles from './style.module.scss';
import { ProductOfferHeaderProps } from './types.ts';
import type { FC, ReactNode } from 'react';

/**
 * Product Detail Card Header component.
 *
 * @param {ProductOfferHeaderProps} props - Component props.
 * @return {ReactNode}  ProductOfferHeader react component.
 */
export const ProductOfferHeader: FC< ProductOfferHeaderProps > = ( {
	title = __( 'Popular upgrade', 'jetpack-components' ),
} ) => {
	return (
		<div className={ styles[ 'card-header' ] }>
			<Icon icon={ star } className={ styles[ 'product-bundle-icon' ] } size={ 24 } />
			<Text variant="label">{ title }</Text>
		</div>
	);
};
