import {
	isStillUsableWithFreePlan,
	getRequiredPlan,
	getUsableBlockProps,
} from '@automattic/jetpack-shared-extension-utils';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo, useContext } from '@wordpress/element';
import classNames from 'classnames';
import { useRef } from 'react';
import { PaidBlockContext, PaidBlockProvider } from './components';
import UpgradePlanBanner from './upgrade-plan-banner';
import { trackUpgradeBannerImpression, trackUpgradeClickEvent } from './utils';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		const { name, className, clientId, isSelected, attributes, setAttributes } = props || {};
		const { onChildBannerVisibilityChange, hasParentBanner } = useContext( PaidBlockContext ) || {};

		const requiredPlan = getRequiredPlan( name );

		if ( ! requiredPlan ) {
			return <BlockListBlock { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( name );
		const usableBlocksProps = getUsableBlockProps( name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );
		const [ hasBannerAlreadyShown, setBannerAlreadyShown ] = useState( false );
		const [ isChildBannerVisible, setIsChildBannerVisible ] = useState( false );

		const bannerContext = 'editor-canvas';
		const hasChildrenSelected = useSelect(
			select => select( 'core/block-editor' ).hasSelectedInnerBlock( clientId, true ),
			[]
		);

		// Banner should be not be displayed if one of its children is already displaying a banner.
		const isBannerVisible =
			( isSelected || hasChildrenSelected ) && isVisible && ! isChildBannerVisible;

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

		// Set isChildBannerVisible for parent block.
		useEffect( () => {
			// onChildBannerVisibilityChange sets isChildBannerVisible for our parent paid block.
			// It is undefined if this block has no parent paid block.
			if ( onChildBannerVisibilityChange ) {
				onChildBannerVisibilityChange( isBannerVisible || isChildBannerVisible );
			}
		}, [ isBannerVisible, isChildBannerVisible, onChildBannerVisibilityChange ] );

		const wrapperRef = useRef();

		useEffect( () => {
			if ( ! isBannerVisible ) {
				return;
			}
			const wrapperEl = wrapperRef.current;
			const nudgeHeight = wrapperEl.querySelector( '.jetpack-upgrade-plan-banner' )?.offsetHeight;
			if ( ! nudgeHeight ) {
				return;
			}

			const listBlock = wrapperEl.querySelector( '.block-editor-block-list__block.is-upgradable' );
			if ( ! listBlock ) {
				return;
			}
			listBlock.style.paddingTop = nudgeHeight + 'px';
		}, [ isBannerVisible ] );

		// Set banner CSS classes depending on its visibility.
		const listBlockCSSClass = classNames( className, {
			'is-upgradable': isBannerVisible,
		} );

		return (
			<PaidBlockProvider
				onBannerVisibilityChange={ setIsVisible }
				onChildBannerVisibilityChange={ setIsChildBannerVisible }
				hasParentBanner
			>
				<div ref={ wrapperRef }>
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
				</div>
			</PaidBlockProvider>
		);
	},
	'withUpgradeBanner'
);
