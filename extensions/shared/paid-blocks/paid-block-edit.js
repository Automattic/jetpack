/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';
import { isUpgradable } from '../plan-utils';

export default OriginalBlockEdit => props => {
	if ( ! isUpgradable( props?.name ) ) {
		return <OriginalBlockEdit { ...props } />;
	}

	const isTopLevelBlock = ! useSelect( select => {
		return select( 'core/block-editor' ).getBlockRootClientId( props.clientId, 'core/block-preview' );
	} );

	if ( ! isTopLevelBlock ) {
		return <OriginalBlockEdit { ...props } />;
	}

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner description={ null } align={ props?.attributes?.align } />
			</InspectorControls>

			<UpgradePlanBanner title={ null } align={ props?.attributes?.align } />
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
