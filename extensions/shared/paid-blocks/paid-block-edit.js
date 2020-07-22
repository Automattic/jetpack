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

	const isVisible = useSelect( select => (
		! select( 'core/block-editor' ).getBlockRootClientId( props.clientId ) && // is top level block.
		 select( 'core/block-editor' ).isBlockSelected( props.clientId ) // is selected.
	) );

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner description={ null } blockName={ props.name } />
			</InspectorControls>

			<UpgradePlanBanner
				className={ `is-${ props.name.replace( /\//, '-' ) }-premium-block` }
				title={ null }
				align={ props?.attributes?.align }
				visible={ isVisible }
			/>
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
