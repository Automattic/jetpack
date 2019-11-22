/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export function LoadingCard( props ) {
	const { header, action, module, support } = props;

	return (
		<SettingsCard header={ header } hideButton action={ action }>
			<SettingsGroup module={ module } support={ support }>
				{ __( 'Checking site status…' ) }
			</SettingsGroup>
		</SettingsCard>
	);
}
