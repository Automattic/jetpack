import {
	isStillUsableWithFreePlan,
	getRequiredPlan,
	getUsableBlockProps,
} from '@automattic/jetpack-shared-extension-utils';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { render, useState, useEffect, useMemo, useContext } from '@wordpress/element';
import { PaidBlockContext, PaidBlockProvider } from './components';
import UpgradePlanBanner from './upgrade-plan-banner';
import { trackUpgradeBannerImpression, trackUpgradeClickEvent } from './utils';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const { name, clientId, isSelected, attributes, setAttributes } = props || {};
		const { hasParentBanner } = useContext( PaidBlockContext ) || {};

		const requiredPlan = getRequiredPlan( name );

		if ( ! requiredPlan ) {
			return <BlockEdit { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( name );
		const usableBlocksProps = getUsableBlockProps( name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );
		const [ hasBannerAlreadyShown, setBannerAlreadyShown ] = useState( false );

		const bannerContext = 'editor-canvas';
		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( clientId, true ),
			[]
		);

		// Banner should be not be displayed if one of its parents is already displaying a banner.
		const isBannerVisible = ( isSelected || hasChildrenSelected ) && isVisible && ! hasParentBanner;

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

		// Record whether the banner should be displayed on the frontend.
		useEffect( () => {
			// Do not display the frontend banner for nested paid blocks.
			setAttributes( { shouldDisplayFrontendBanner: ! hasParentBanner } );
		}, [ setAttributes, hasParentBanner ] );

		useEffect( () => {
			let upgradeBannerContainer = document.querySelector(
				`[data-block="${ clientId }"] > .jetpack-block-upgrade-banner-container`
			);
			if ( ! upgradeBannerContainer ) {
				upgradeBannerContainer = document.createElement( 'div' );
				upgradeBannerContainer.classList.add( 'jetpack-block-upgrade-banner-container' );
				document.querySelector( `[data-block="${ clientId }"]` ).prepend( upgradeBannerContainer );
			}

			render(
				<UpgradePlanBanner
					className={ `is-${ name.replace( /\//, '-' ) }-paid-block` }
					title={ null }
					align={ attributes?.align }
					visible={ isBannerVisible }
					description={ usableBlocksProps?.description }
					requiredPlan={ requiredPlan }
					context={ bannerContext }
					onRedirect={ () => trackUpgradeClickEvent( trackEventData ) }
				/>,
				upgradeBannerContainer
			);
		}, [
			attributes?.align,
			clientId,
			isBannerVisible,
			name,
			requiredPlan,
			trackEventData,
			usableBlocksProps?.description,
		] );

		return (
			<PaidBlockProvider onBannerVisibilityChange={ setIsVisible } hasParentBanner>
				<BlockEdit { ...props } />
			</PaidBlockProvider>
		);
	},
	'withUpgradeBanner'
);
