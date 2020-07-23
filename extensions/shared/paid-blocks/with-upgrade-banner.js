/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
// import './style.scss';
import { isUpgradable } from '../plan-utils';
import UpgradePlanBanner from './upgrade-plan-banner';

export default createHigherOrderComponent(
	BlockListBlock => props => {
		if ( ! isUpgradable( props?.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		const isVisible = useSelect(
			select =>
				select( 'core/block-editor' ).isBlockSelected( props.clientId ) ||
				select( 'core/block-editor' ).hasSelectedInnerBlock( props.clientId ),
			[]
		);

		return (
			<Fragment>
				<UpgradePlanBanner
					className={ `is-${ props.name.replace( /\//, '-' ) }-premium-block` }
					title={ null }
					align={ props?.attributes?.align }
					visible={ isVisible }
				/>

				<BlockListBlock { ...props } className="is-interactive is-upgradable" />
			</Fragment>
		);
	},
	'withUpgradeBanner'
);
