/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';
import { isUpgradable } from '../../shared/plan-utils';

export default OriginalBlockEdit => props => {
	const requiredPlan = isUpgradable( props?.name );
	if ( ! requiredPlan ) {
		return <OriginalBlockEdit { ...props } />;
	}

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner description={ null } requiredPlan={ requiredPlan } />
			</InspectorControls>

			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
