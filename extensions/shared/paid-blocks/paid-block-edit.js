
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
			<UpgradePlanBanner align={ props?.attributes?.align } />
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
