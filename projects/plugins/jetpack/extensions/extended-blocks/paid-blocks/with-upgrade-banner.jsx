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

const withUpgradeBanner = createHigherOrderComponent(
	BlockEdit => props => {
		const { name, clientId, isSelected, attributes, setAttributes } = props || {};
		const requiredPlan = getRequiredPlan( name );

		// CAUTION: code added before this line will be executed for all blocks
		// (also the paragraph block, every time on typing), not just paid
		// blocks!
		// NOTE: creating hooks conditionally is not a good practice,
		// but still it's better than having the code executed for all blocks.
		// @see https://legacy.reactjs.org/docs/hooks-rules.html#only-call-hooks-at-the-top-level
		// @todo: work on a better implementation.
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
		const { hasParentBanner } = useContext( PaidBlockContext ) || {};
		// Banner should be not be displayed if one of its parents is already displaying a banner.
		const isBannerVisible = ( isSelected || hasChildrenSelected ) && isVisible && ! hasParentBanner;
		const { tracks } = useAnalytics();
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
		// Fix for width of cover block because otherwise the div defaults to content-size as max width
		const cssFixForCoverBlock = { 'max-width': 'unset' };

		return (
			<PaidBlockProvider
				onBannerVisibilityChange={ setIsVisible }
				hasParentBanner={ isBannerVisible }
			>
				<div ref={ blockProps.ref } style={ cssFixForCoverBlock }>
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

export default withUpgradeBanner;

/**
 * Helper function that extends the Edit function
 * of the block with the upgrade banner,
 * by using the `withUpgradeBanner` HOC.
 * It has been designed to be bound with a `blocks.registerBlockType` call.
 *
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @returns {object}          The extended block settings.
 */

export function blockEditWithUpgradeBanner( settings, name ) {
	const requiredPlan = getRequiredPlan( name );
	if ( ! requiredPlan ) {
		return settings;
	}

	return {
		...settings,
		edit: withUpgradeBanner( settings.edit ),
	};
}
