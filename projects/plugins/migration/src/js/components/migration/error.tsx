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
			return sprintf(
				/* translators: %s: Message from the server e.g: "There's a problem getting your import's status." */
				__( 'Error: %s', 'wpcom-migration' ),
				message
			);
		}
		return __( "Sorry, there's a problem getting your import's status.", 'wpcom-migration' );
	};

	return (
		<ConnectScreenLayout
			className={ 'wordpress-branding' }
			logo={ <WordPressLogo /> }
			title={ __( 'Oops, something went wrong…', 'wpcom-migration' ) }
			images={ [ migrationImage1 ] }
		>
			<p> { renderErrorMessages() } </p>
		</ConnectScreenLayout>
	);
}
