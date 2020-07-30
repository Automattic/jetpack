/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useContext } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isUpgradable } from './utils';
import { PremiumBlockContext } from '../../premium-blocks/components';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const { name } = useBlockEditContext();
		if ( ! isUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		const onBannerVisibilityChange = useContext( PremiumBlockContext );
		const { attributes } = props;

		// Hide Banner when block changes its attributes.
		useEffect(
			() => onBannerVisibilityChange( false )
			, [ attributes, onBannerVisibilityChange ]
		);

		return (
			<BlockEdit { ...props } />
		);
	},
	'JetpackCoverBlockEdit'
);
