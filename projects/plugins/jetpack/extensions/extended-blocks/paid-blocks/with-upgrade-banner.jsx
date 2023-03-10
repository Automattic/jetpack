import {
	isStillUsableWithFreePlan,
	getRequiredPlan,
	getUsableBlockProps,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo, useContext } from '@wordpress/element';
import { PaidBlockContext, PaidBlockProvider } from './components';
import UpgradePlanBanner from './upgrade-plan-banner';
import { trackUpgradeBannerImpression, trackUpgradeClickEvent } from './utils';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const { name, clientId, isSelected, attributes, setAttributes } = props || {};
		const { hasParentBanner } = useContext( PaidBlockContext ) || {};
		const { tracks } = useAnalytics();

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
				tracks,
			} ),
			[ requiredPlan, name, tracks ]
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

		const blockProps = useBlockProps();

		return (
			<PaidBlockProvider
				onBannerVisibilityChange={ setIsVisible }
				hasParentBanner={ isBannerVisible }
			>
				<div ref={ blockProps.ref }>
					<UpgradePlanBanner
						className={ `is-${ name.replace( /\//, '-' ) }-paid-block` }
						title={ null }
						align={ attributes?.align }
						visible={ isBannerVisible }
						description={ usableBlocksProps?.description }
						requiredPlan={ requiredPlan }
						context={ bannerContext }
						onRedirect={ () => trackUpgradeClickEvent( trackEventData ) }
					/>
					<BlockEdit { ...props } />
				</div>
			</PaidBlockProvider>
		);
	},
	'withUpgradeBanner'
);
