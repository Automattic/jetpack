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

const name = 'donations-annual-view';

const settings = getChildViewSettings(
	__( 'Annual Donation View', 'jetpack' ),
	__( 'The container for annual donations.', 'jetpack' ),
	edit,
	save
);

export { name, settings };
