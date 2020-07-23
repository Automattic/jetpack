/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
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

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner description={ null } blockName={ props.name } />
			</InspectorControls>

			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
