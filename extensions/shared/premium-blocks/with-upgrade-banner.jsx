/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isUpgradable } from '../plan-utils';
import UpgradePlanBanner from './upgrade-plan-banner';
import { PremiumBlockProvider } from './components';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		if ( ! isUpgradable( props?.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		const [ isVisible, setIsVisible ] = useState( true );

		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( props.clientId ),
			[]
		);

		const isBannerVisible = ( props?.isSelected || hasChildrenSelected ) && isVisible;

		return (
			<PremiumBlockProvider onBannerVisibilityChange={ setIsVisible }>
				<UpgradePlanBanner
					className={ `is-${ props.name.replace( /\//, '-' ) }-premium-block` }
					title={ null }
					align={ props?.attributes?.align }
					visible={ isBannerVisible }
				/>

				<BlockListBlock { ...props } className="is-interactive is-upgradable" />
			</PremiumBlockProvider>
		);
	},
	'withUpgradeBanner'
);
