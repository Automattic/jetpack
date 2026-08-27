import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { getConnectScreenErrorMessage } from '../../../helpers/get-connect-screen-error-message';
import type { MouseEventHandler } from 'react';

export { getConnectScreenErrorMessage };

export type Props = {
	// The Connect Button label
	buttonLabel: string;
	// Callback to be called on button click
	handleButtonClick?: MouseEventHandler< HTMLElement >;
	// Whether the button is loading or not
	buttonIsLoading?: boolean;
	// Whether the error message appears or not
	displayButtonError?: boolean;
	// The connection error code
	errorCode?: string;
	// Whether the site is in offline mode
	isOfflineMode?: boolean;
};

/**
 * The shared Connect Screen action: the primary connect button, its loading
 * state, and the connection error message. Used by both the Basic and
 * Required Plan connect screens.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The Connect Screen Action component.
 */
function ConnectScreenAction( {
	buttonLabel,
	handleButtonClick,
	buttonIsLoading,
	displayButtonError,
	errorCode,
	isOfflineMode,
}: Props ) {
	return (
		<>
			<Button
				className="jp-connection__connect-screen__action-button"
				onClick={ handleButtonClick }
				loading={ buttonIsLoading }
				disabled={ isOfflineMode }
			>
				{ buttonLabel }
			</Button>
			{ ( displayButtonError || isOfflineMode ) && (
				<p className="jp-connection__connect-screen__error">
					{ getConnectScreenErrorMessage( errorCode, isOfflineMode ) ||
						__( 'An error occurred. Please try again.', 'jetpack-connection-js' ) }
				</p>
			) }
		</>
	);
}

export default ConnectScreenAction;
