/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { getChildViewSettings } from '../../common/factory';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'donations-one-time-view';

const settings = getChildViewSettings(
	__( 'One Time Donation View', 'jetpack' ),
	__( 'The container for one time donations.', 'jetpack' ),
	edit,
	save
);

export { name, settings };
