/**
 * Internal dependencies
 */
import DonationsContext from '../../common/donations-context';
import { ONE_TIME_DONATION_TAB } from '../../common/constants';
import { getChildViewTemplate } from '../../common/factory';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const template = getChildViewTemplate( __( 'Make a one-time donation', 'jetpack' ) );

const Edit = () => {
	const { activeTab } = useContext( DonationsContext );

	return activeTab === ONE_TIME_DONATION_TAB && template;
};

export default Edit;
