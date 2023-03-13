import { JetpackSearchLogo } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { STORE_ID } from 'store';
import './styles.scss';

const Header = () => {
	const activateLicenseUrl = useSelect(
		select => `${ select( STORE_ID ).getSiteAdminUrl() }admin.php?page=my-jetpack#/add-license`
	);

	return (
		<div className="jp-search-dashboard-upsell-page__header">
			<span className="jp-search-dashboard-upsell-page__logo">
				<JetpackSearchLogo />
			</span>
			<p>
				Already have an existing plan or license key?{ ' ' }
				<a href={ activateLicenseUrl }>Click here to get started</a>
			</p>
		</div>
	);
};

export default Header;
