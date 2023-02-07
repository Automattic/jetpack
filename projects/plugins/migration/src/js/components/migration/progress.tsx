import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { WordPressLogo } from '../illustrations';
import migrationImage2 from './../../../../images/migration-2.png';
import './styles.module.scss';

interface Props {
	apiRoot: string;
	apiNonce: string;
}
/**
 * Migration progress screen
 *
 * @param {object} props - Props
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationProgress( props: Props ) {
	const { apiRoot, apiNonce } = props;

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'Migrating your site..', 'jetpack-migration' ) }
			images={ [ migrationImage2 ] }
		>
			<p>
				{ __(
					"We're safely gathering your data, which can take a few minutes to a few hours. Once the migration is done, we'll notify you, and you can visit your brand-new WordPress.com Dashboard!",
					'jetpack-migration'
				) }
			</p>

			<div className={ 'action-buttons' }>
				<Button
					isSecondary={ true }
					target={ '_blank' }
					href={ getRedirectUrl(
						'https://wordpress.com/support/import/import-an-entire-wordpress-site/'
					) }
				>
					{ __( 'Check your migration progress', 'jetpack-migration' ) }
				</Button>
			</div>
			<p className={ 'get-started-help' }>
				{ createInterpolateElement(
					__( 'Do you need help? <Button>Contact us.</Button>', 'jetpack-migration' ),
					{
						Button: (
							<Button
								href={ getRedirectUrl( 'https://wordpress.com/support/help-support-options/' ) }
								target={ '_blank' }
							/>
						),
					}
				) }
			</p>
		</ConnectScreenLayout>
	);
}
