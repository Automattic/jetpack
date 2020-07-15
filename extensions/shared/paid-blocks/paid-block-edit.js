
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';

export default OriginalBlockEdit => props => {
	return (
		<Fragment>
			<UpgradePlanBanner />
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
