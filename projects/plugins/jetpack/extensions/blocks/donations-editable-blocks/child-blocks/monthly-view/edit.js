/**
 * Internal dependencies
 */
import { getChildViewTemplate } from '../../common/factory';
import DonationsContext from '../../common/donations-context';
import { MONTHLY_DONATION_TAB } from '../../common/constants';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const template = getChildViewTemplate( __( 'Make a monthly donation', 'jetpack' ) );

const Edit = () => {
	const { activeTab } = useContext( DonationsContext );

	return activeTab === MONTHLY_DONATION_TAB && template;
};

export default Edit;
