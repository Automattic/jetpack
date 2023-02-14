import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { WordPressLogo } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import './styles.module.scss';

/**
 * Migration loading screen
 *
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationLoading() {
	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'WordPress.com Migration', 'jetpack-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p>{ __( 'Loading…', 'jetpack-migration' ) }</p>
		</ConnectScreenLayout>
	);
}
