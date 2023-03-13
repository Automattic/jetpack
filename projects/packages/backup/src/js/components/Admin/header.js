import { JetpackVaultPressBackupLogo } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import useCapabilities from '../../hooks/useCapabilities';
import { STORE_ID } from '../../store';
import { useIsFullyConnected } from './hooks';

const Header = () => {
	const isFullyConnected = useIsFullyConnected();

	const { capabilities, capabilitiesError, capabilitiesLoaded, hasBackupPlan } = useCapabilities();
	const noBackupCapabilities =
		! hasBackupPlan &&
		capabilitiesLoaded &&
		! capabilitiesError &&
		Array.isArray( capabilities ) &&
		capabilities.length === 0;

	const { activateLicenseUrl, shouldShowActivateLicenseLink } = useSelect(
		select => {
			const store = select( STORE_ID );
			return {
				activateLicenseUrl: `${
					store.getSiteData().adminUrl
				}admin.php?page=my-jetpack#/add-license`,

				// This Boolean expression mirrors the logic found
				// in the LoadedState component, in ./index.js
				shouldShowActivateLicenseLink: isFullyConnected && noBackupCapabilities,
			};
		},
		[ isFullyConnected, noBackupCapabilities ]
	);

	return (
		<div className="jetpack-admin-page__header">
			<span className="jetpack-admin-page__logo">
				<JetpackVaultPressBackupLogo />
			</span>
			{ shouldShowActivateLicenseLink && (
				<p>
					Already have an existing plan or license key?{ ' ' }
					<a href={ activateLicenseUrl }>Click here to get started</a>
				</p>
			) }
		</div>
	);
};

export default Header;
