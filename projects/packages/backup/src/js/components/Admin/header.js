import { JetpackVaultPressBackupLogo } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import useCapabilities from '../../hooks/useCapabilities';
import { STORE_ID } from '../../store';
import { useIsFullyConnected } from './hooks';

const Header = () => {
	const showActivateLicenseLink = useShowActivateLicenseLink();

	return (
		<div className="jetpack-admin-page__header">
			<span className="jetpack-admin-page__logo">
				<JetpackVaultPressBackupLogo />
			</span>
			{ showActivateLicenseLink && <ActivateLicenseLink /> }
		</div>
	);
};

const useShowActivateLicenseLink = () => {
	const isFullyConnected = useIsFullyConnected();

	const { capabilities, capabilitiesError, capabilitiesLoaded, hasBackupPlan } = useCapabilities();

	return useMemo( () => {
		const noBackupCapabilities =
			! hasBackupPlan &&
			capabilitiesLoaded &&
			! capabilitiesError &&
			Array.isArray( capabilities ) &&
			capabilities.length === 0;

		// This Boolean expression mirrors the logic found
		// in the LoadedState component, in ./index.js,
		// because these conditions are what triggers the pricing page to be displayed.
		const shouldShow = isFullyConnected && noBackupCapabilities;

		if ( ! shouldShow ) {
			return null;
		}
	}, [ isFullyConnected, hasBackupPlan, capabilitiesLoaded, capabilitiesError, capabilities ] );
};

const ActivateLicenseLink = () => {
	const activateLicenseUrl = useSelect( select => {
		const wpAdminUrl = select( STORE_ID ).getSiteData().adminUrl;
		return `${ wpAdminUrl }admin.php?page=my-jetpack#/add-license`;
	}, [] );

	return (
		<p>
			{ createInterpolateElement(
				__(
					'Already have an existing plan or license key? <a>Click here to get started</a>',
					'jetpack-backup-pkg'
				),
				{
					a: <a href={ activateLicenseUrl } />,
				}
			) }
		</p>
	);
};

export default Header;
