import { Text } from '@automattic/jetpack-components';
import { Icon, check } from '@wordpress/icons';
import clsx from 'clsx';
import { type FC } from 'react';
import styles from './style.module.scss';

interface ProductInterstitialFeatureListProps {
	/**
	 * List of features to display
	 */
	features: string[];
	/**
	 * Optional className for custom styling
	 */
	className?: string;
}

/**
 * Component that renders a list of features for the product interstitial
 *
 * @param {ProductInterstitialFeatureListProps} props - Component properties
 * @return {React.ReactElement} The rendered component
 */
const ProductInterstitialFeatureList: FC< ProductInterstitialFeatureListProps > = ( {
	features,
	className,
} ) => {
	if ( ! features?.length ) {
		return null;
	}

	return (
		<ul className={ clsx( styles.features, className ) }>
			{ features.map( ( feature, id ) => (
				<Text component="li" key={ `feature-${ id }` } variant="body">
					<Icon icon={ check } size={ 24 } />
					{ feature }
				</Text>
			) ) }
		</ul>
	);
};

export default ProductInterstitialFeatureList;
