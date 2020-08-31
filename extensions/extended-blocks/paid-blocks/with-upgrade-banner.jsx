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
import {
	isStillUsableWithFreePlan,
	getRequiredPlan,
	getUsableBlockProps,
} from '../../shared/plan-utils';
import UpgradePlanBanner from './upgrade-plan-banner';
import { PaidBlockProvider } from './components';
import { trackUpgradeBannerImpression, trackUpgradeClickEvent } from './utils';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		const requiredPlan = getRequiredPlan( props?.name );
		if ( ! requiredPlan ) {
			return <BlockListBlock { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( props.name );
		const usableBlocksProps = getUsableBlockProps( props.name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );
		const [ hasBannerAlreadyShown, setBannerAlreadyShown ] = useState( false );

		const bannerContext = 'editor-canvas';
		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( props?.clientId ),
			[]
		);
		const isBannerVisible = ( props?.isSelected || hasChildrenSelected ) && isVisible;

		const trackEventData = {
			plan: requiredPlan,
			blockName: props.name,
			context: bannerContext,
		};

		// Record event just once, the first time.
		useEffect( () => {
			if ( ! isBannerVisible ) {
				return;
			}

			setBannerAlreadyShown( true );
		}, [ isBannerVisible, setBannerAlreadyShown ] );

		useEffect( () => {
			if ( hasBannerAlreadyShown || ! isBannerVisible ) {
				return;
			}
			trackUpgradeBannerImpression( trackEventData );
		}, [ hasBannerAlreadyShown, trackEventData, isBannerVisible ] );

		// Hide Banner when block changes its attributes (dual Mode).
		useEffect( () => setIsVisible( ! isDualMode ), [ props.attributes, setIsVisible, isDualMode ] );

		// Set banner CSS classes depending on its visibility.
		const listBlockCSSClass = classNames( props?.className, {
			'is-upgradable': isBannerVisible,
		} );

		return (
			<PaidBlockProvider onBannerVisibilityChange={ setIsVisible }>
				<UpgradePlanBanner
					className={ `is-${ props.name.replace( /\//, '-' ) }-paid-block` }
					title={ null }
					align={ props?.attributes?.align }
					visible={ isBannerVisible }
					description={ usableBlocksProps?.description }
					requiredPlan={ requiredPlan }
					context={ bannerContext }
					onRedirect={ () => trackUpgradeClickEvent( trackEventData ) }
				/>

				<BlockListBlock { ...props } className={ listBlockCSSClass } />
			</PaidBlockProvider>
		);
	},
	'withUpgradeBanner'
);
