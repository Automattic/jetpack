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
	getUsableBlockProps,
	isUpgradable,
} from '../../shared/plan-utils';
import UpgradePlanBanner from './upgrade-plan-banner';
import { PaidBlockProvider } from './components';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		const requiredPlan = isUpgradable( props?.name );
		if ( ! requiredPlan ) {
			return <BlockListBlock { ...props } />;
		}

		const isDualMode = isStillUsableWithFreePlan( props.name );
		const usableBlocksProps = getUsableBlockProps( props.name );

		const [ isVisible, setIsVisible ] = useState( ! isDualMode );

		// Hide Banner when block changes its attributes (dual Mode).
		useEffect( () => setIsVisible( ! isDualMode ), [ props.attributes, setIsVisible, isDualMode ] );

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
			<PaidBlockProvider onBannerVisibilityChange={ setIsVisible }>
				<UpgradePlanBanner
					className={ `is-${ props.name.replace( /\//, '-' ) }-paid-block` }
					title={ null }
					align={ props?.attributes?.align }
					visible={ isBannerVisible }
					description={ usableBlocksProps?.description }
					requiredPlan={ requiredPlan }
				/>

				<BlockListBlock { ...props } className={ listBlockCSSClass } />
			</PaidBlockProvider>
		);
	},
	'withUpgradeBanner'
);
