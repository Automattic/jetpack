
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
