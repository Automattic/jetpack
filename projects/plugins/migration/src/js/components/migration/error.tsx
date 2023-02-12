import { ConnectScreenLayout } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { WordPressLogo } from '../illustrations';
import migrationImage1 from './../../../../images/migration-1.png';
import './styles.module.scss';

interface Props {
	message?: string;
}
/**
 * Migration error screen
 *
 * @param {object} props - Props
 * @returns {React.ReactElement} JSX Element
 */
export function MigrationError( props: Props ) {
	const { message } = props;
	const renderErrorMessages = () => {
		if ( message ) {
			/* translators: %s: message from the server e.g: "There's a problem getting your import's status." */
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
