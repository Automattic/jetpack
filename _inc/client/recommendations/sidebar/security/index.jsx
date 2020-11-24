/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import { Layout } from '../layout';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { imagePath } from 'constants/urls';

const Security = () => {
	// TODO: button href
	// TODO: dynamic text in 1st paragraph

	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/manage-security.svg' }
			content={
				<div>
					<h2>{ __( 'Manage your security on Jetpack.com' ) }</h2>
					<p>
						{ __(
							'Did you know you can manage all your {Daily} backups {and security scans} right from Jetpack.com? '
						) }
					</p>
					<p>
						{ __(
							'You can also use your included Activity feature to monitor every change that occurs on your site!'
						) }
					</p>
					<Button primary>
						{ __( 'Manage security on Jetpack.com' ) }
						<Gridicon icon="external" />
					</Button>
				</div>
			}
		/>
	);
};

export { Security };
