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

const name = 'donations-monthly-view';

const settings = getChildViewSettings(
	__( 'Monthly Donation View', 'jetpack' ),
	__( 'The container for monthly donations.', 'jetpack' ),
	edit,
	save
);

export { name, settings };
