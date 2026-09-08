import { Icon } from '@wordpress/ui';
import clsx from 'clsx';
import { PRODUCT_ICONS } from '../products/mappings';
import { getFeatureIcon } from './icons';
import styles from './styles.module.scss';
import type { JetpackProductWithCard } from '../../../types';

type FeatureIconProps = {
	feature: MainFeature;
	small?: boolean;
};

/**
 * The feature's tile, matching the icons on the product cards.
 *
 * Four main features have no product icon of their own (Activity Log, Blaze,
 * Newsletter, Podcast), so they get a tile in the same palette with a generic glyph
 * rather than borrowing another product's branding.
 *
 * @param {FeatureIconProps} props         - The component props.
 * @param {MainFeature}      props.feature - The feature to render an icon for.
 * @param {boolean}          props.small   - Render at the smaller size used in the
 *                                         previous/next footer.
 * @return The rendered component.
 */
export function FeatureIcon( { feature, small = false }: FeatureIconProps ) {
	const ProductIcon = PRODUCT_ICONS[ feature.product as JetpackProductWithCard ];
	const className = clsx( styles[ 'feature-icon' ], {
		[ styles[ 'feature-icon--small' ] ]: small,
	} );

	if ( ProductIcon ) {
		return (
			<span className={ className }>
				<ProductIcon />
			</span>
		);
	}

	return (
		<span className={ className }>
			<span className={ styles[ 'feature-icon__fallback' ] }>
				<Icon icon={ getFeatureIcon( feature.icon ) } size={ small ? 16 : 28 } />
			</span>
		</span>
	);
}
