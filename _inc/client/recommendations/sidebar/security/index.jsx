/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { Layout } from '../layout';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { imagePath } from 'constants/urls';
import getRedirectUrl from 'lib/jp-redirect';
import { getSiteRawUrl } from 'state/initial-state';

const SecurityComponent = props => {
	const { siteRawUrl } = props;

	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/manage-security.svg' }
			content={
				<div>
					<h2>{ __( 'Manage your security on Jetpack.com' ) }</h2>
					<p>{ __( 'Did you know you can manage all your backups right from Jetpack.com? ' ) }</p>
					<p>
						{ __(
							'You can also use your included Activity feature to monitor every change that occurs on your site!'
						) }
					</p>
					<Button
						primary
						href={ getRedirectUrl( 'jetpack-backup', { site: siteRawUrl } ) }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Manage security on Jetpack.com' ) }
						<Gridicon icon="external" />
					</Button>
				</div>
			}
		/>
	);
};

const Security = connect( state => ( { siteRawUrl: getSiteRawUrl( state ) } ) )(
	SecurityComponent
);

export { Security };
