import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { WordPressLogo } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import './styles.module.scss';

/**
 * Migration error screen
 *
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationError() {
	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'Oops, migration is active…', 'jetpack-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p>
				{ __(
					"Sorry, an import from this site is still in progress: we can't start a new one.",
					'jetpack-migration'
				) }
			</p>
		</ConnectScreenLayout>
	);
}
