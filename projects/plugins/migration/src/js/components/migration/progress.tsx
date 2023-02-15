import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { useCallback } from 'react/cjs/react.production.min';
import { MIGRATION_HANDLER_ROUTE } from '../constants';
import useAnalytics from '../hooks/use-analytics';
import { WordPressLogo } from '../illustrations';
import migrationImage2 from './../../../../images/migration-2.png';
import './styles.module.scss';

interface Props {
	apiRoot: string;
	apiNonce: string;
	sourceSiteSlug: string;
}
/**
 * Migration progress screen
 *
 * @param {object} props - Props
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationProgress( props: Props ) {
	const { apiRoot, apiNonce, sourceSiteSlug } = props;
	const { tracks } = useAnalytics( apiRoot, apiNonce );

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const onCheckProgressClick = useCallback( () => {
		tracks.recordEvent( `wpcom_migration_check_progress_click`, { sourceSiteSlug } );
	}, [ tracks, sourceSiteSlug ] );

	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'Migrating your site..', 'wpcom-migration' ) }
			images={ [ migrationImage2 ] }
		>
			<p>
				{ __(
					"We're safely gathering your data, which can take a few minutes to a few hours. Once the migration is done, we'll notify you, and you can visit your brand-new WordPress.com Dashboard!",
					'wpcom-migration'
				) }
			</p>

			<div className={ 'action-buttons' }>
				<Button
					isSecondary={ true }
					target={ '_blank' }
					href={ `${ MIGRATION_HANDLER_ROUTE }?from=${ sourceSiteSlug }` }
					click={ onCheckProgressClick }
				>
					{ __( 'Check your migration progress', 'wpcom-migration' ) }
				</Button>
			</div>
			<p className={ 'get-started-help' }>
				{ createInterpolateElement(
					__( 'Do you need help? <Button>Contact us.</Button>', 'wpcom-migration' ),
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
