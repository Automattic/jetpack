/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isStillUsableWithFreePlan, isUpgradable } from '../plan-utils';
import UpgradePlanBanner from './upgrade-plan-banner';
import { PremiumBlockProvider } from './components';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		if ( ! isUpgradable( props?.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( props?.name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );

		// Hide Banner when block changes its attributes (dual Mode).
		useEffect( () =>
			setIsVisible( ! isDualMode )
			, [ props.attributes, setIsVisible, isDualMode ]
		);

		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( props?.clientId ),
			[]
		);

		const isBannerVisible = ( props?.isSelected || hasChildrenSelected ) && isVisible;

		// Set banner CSS classes depending on its visibility.
		const listBlockCSSClass = classNames( props?.className, {
			'is-upgradable': isBannerVisible,
		} );

		return (
			<PremiumBlockProvider onBannerVisibilityChange={ setIsVisible }>
				<UpgradePlanBanner
					className={ `is-${ props.name.replace( /\//, '-' ) }-premium-block` }
					title={ null }
					align={ props?.attributes?.align }
					visible={ isBannerVisible }
				/>

				<BlockListBlock { ...props } className={ listBlockCSSClass } />
			</PremiumBlockProvider>
		);
	},
	'withUpgradeBanner'
);
