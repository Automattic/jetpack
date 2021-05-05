/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useEffect, useMemo, useContext } from '@wordpress/element';
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
import { PaidBlockContext, PaidBlockProvider } from './components';
import { trackUpgradeBannerImpression, trackUpgradeClickEvent } from './utils';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		const { name, className, clientId, isSelected, attributes, setAttributes } = props || {};
		const { isParentBannerVisible, hasParentBanner } = useContext( PaidBlockContext ) || {};

		const requiredPlan = getRequiredPlan( name );

		if ( ! requiredPlan || isParentBannerVisible ) {
			return <BlockListBlock { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( name );
		const usableBlocksProps = getUsableBlockProps( name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );
		const [ hasBannerAlreadyShown, setBannerAlreadyShown ] = useState( false );

		const bannerContext = 'editor-canvas';
		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( clientId ),
			[]
		);
		const isBannerVisible = ( isSelected || hasChildrenSelected ) && isVisible;

		const trackEventData = useMemo(
			() => ( {
				plan: requiredPlan,
				blockName: name,
				context: bannerContext,
			} ),
			[ requiredPlan, name, bannerContext ]
		);

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
		useEffect( () => setIsVisible( ! isDualMode ), [ attributes, setIsVisible, isDualMode ] );

		// Record whether the banner should be displayed on the frontend
		useEffect( () => {
			// Do not display the frontend banner if a parent block is already displaying it.
			setAttributes( { shouldDisplayFrontendBanner: ! hasParentBanner } );
		}, [ setAttributes, hasParentBanner ] );

		// Set banner CSS classes depending on its visibility.
		const listBlockCSSClass = classNames( className, {
			'is-upgradable': isBannerVisible,
		} );

		return (
			<PaidBlockProvider
				onBannerVisibilityChange={ setIsVisible }
				isParentBannerVisible={ isBannerVisible || isParentBannerVisible }
				hasParentBanner
			>
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
