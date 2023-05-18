/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../shared/components/upgrade-nudge';

const UpgradePrompt = () => {
	return (
		<Nudge
			buttonText={ 'Upgrade' }
			checkoutUrl={ 'admin.php?page=my-jetpack#/add-jetpack-ai' }
			className={ 'jetpack-ai' }
			description={ __( 'Free requests used. Upgrade now to keep using Jetpack AI.', 'jetpack' ) }
			goToCheckoutPage={ () => {} }
			isRedirecting={ false }
			visible={ true }
		/>
	);
};

export default UpgradePrompt;
