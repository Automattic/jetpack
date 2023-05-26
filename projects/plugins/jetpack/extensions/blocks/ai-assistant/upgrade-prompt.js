/*
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../shared/components/upgrade-nudge';

const UpgradePrompt = () => {
	if ( isAtomicSite() || isSimpleSite() ) {
		return null;
	}

	return (
		<Nudge
			buttonText={ 'Upgrade' }
			checkoutUrl={ `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/add-jetpack-ai` }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ __( 'Upgrade now to keep using Jetpack AI.', 'jetpack' ) }
			goToCheckoutPage={ () => {} }
			isRedirecting={ false }
			visible={ true }
		/>
	);
};

export default UpgradePrompt;
