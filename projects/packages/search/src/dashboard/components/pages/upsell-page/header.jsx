import { JetpackSearchLogo } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from 'store';
import './styles.scss';

const Header = () => {
	const activateLicenseUrl = useSelect(
		select => `${ select( STORE_ID ).getSiteAdminUrl() }admin.php?page=my-jetpack#/add-license`
	);

	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	return (
		<div className="jp-search-dashboard-upsell-page__header">
			<span className="jp-search-dashboard-upsell-page__logo">
				<JetpackSearchLogo />
			</span>
			{ ! isWpcom && (
				<p>
					{ createInterpolateElement(
						__(
							'Already have an existing plan or license key? <a>Click here to get started</a>',
							'jetpack-search-pkg'
						),
						{
							a: <a href={ activateLicenseUrl } />,
						}
					) }
				</p>
			) }
		</div>
	);
};

export default Header;
