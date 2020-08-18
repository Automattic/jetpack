/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';
import { getRequiredPlan } from '../../shared/plan-utils';

export default OriginalBlockEdit => props => {
	const requiredPlan = getRequiredPlan( props?.name );
	if ( ! requiredPlan ) {
		return <OriginalBlockEdit { ...props } />;
	}

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner
					description={ null }
					requiredPlan={ requiredPlan }
					context="sidebar"
				/>
			</InspectorControls>

			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
