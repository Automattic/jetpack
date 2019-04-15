/**
 * External dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';
import SharingCheckbox from './sharing-checkbox';

export const name = 'sharing';

export const settings = {
	render: () => (
		<Fragment>
			<SharingCheckbox />
			<JetpackLikesAndSharingPanel.Slot />
		</Fragment>
	),
};
