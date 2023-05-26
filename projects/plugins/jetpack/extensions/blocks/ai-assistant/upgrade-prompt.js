/*
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
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
			description={ createInterpolateElement(
				__(
					'You have reached the limit of free requests.<br /> Upgrade now to keep using Jetpack AI.',
					'jetpack'
				),
				{
					br: <br />,
				}
			) }
			goToCheckoutPage={ () => {} }
			isRedirecting={ false }
			visible={ true }
		/>
	);
};

export default UpgradePrompt;
