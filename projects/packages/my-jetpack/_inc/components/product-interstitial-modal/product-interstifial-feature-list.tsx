import { Text } from '@automattic/jetpack-components';
import { Icon, check } from '@wordpress/icons';
import clsx from 'clsx';
import LoadingBlock from '../loading-block';
import styles from './style.module.scss';
import type { FC, ReactElement } from 'react';

interface ProductInterstitialFeatureListProps {
	/**
	 * List of features to display
	 */
	features: string[];
	/**
	 * Whether or not the product data is loading
	 */
	isLoading: boolean;
	/**
	 * Optional className for custom styling
	 */
	className?: string;
}

/**
 * Component that renders a list of features for the product interstitial
 *
 * @param {ProductInterstitialFeatureListProps} props - Component properties
 * @return {ReactElement} The rendered component
 */
const ProductInterstitialFeatureList: FC< ProductInterstitialFeatureListProps > = ( {
	features,
	isLoading,
	className,
} ) => {
	if ( ! isLoading && ! features?.length ) {
		return null;
	}

	const mockFeaturesArray = [ ...Array( 8 ).keys() ];

	return (
		<ul className={ clsx( styles.features, className ) }>
			{ isLoading
				? mockFeaturesArray.map( ( _, index ) => (
						<LoadingBlock key={ index } height="25px" width="100%" spaceBelow />
				  ) )
				: features.map( ( feature, id ) => (
						<Text component="li" key={ `feature-${ id }` } variant="body">
							<Icon icon={ check } size={ 24 } />
							{ feature }
						</Text>
				  ) ) }
		</ul>
	);
};

export default ProductInterstitialFeatureList;
