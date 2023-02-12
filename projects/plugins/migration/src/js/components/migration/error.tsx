import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { WordPressLogo } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import './styles.module.scss';

/**
 * Migration error screen
 *
 * @param root0
 * @param root0.message
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationError( { message } ) {
	const renderErrorMessages = () => {
		if ( message ) {
			/* translators: %s: Error message from the server e.g: "There's a problem getting your import's status." */
			return sprintf( __( 'Error: %s', 'jetpack-migration' ), message );
		}
		return __( "Sorry, there's a problem getting your import's status.", 'jetpack-migration' );
	};

	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'Oops, something went wrong…', 'jetpack-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p> { renderErrorMessages() } </p>
		</ConnectScreenLayout>
	);
}
