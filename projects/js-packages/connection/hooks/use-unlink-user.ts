import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../state/store';

interface UnlinkOptions {
	/** Force the disconnection. An administrator unlinking themselves needs it. */
	force?: boolean;
	/** Also unlink every other user, which disconnecting the owner requires. */
	disconnectAllUsers?: boolean;
	/** What to show if the request fails, worded for this dialog's audience. */
	errorMessage: string;
}

interface UseUnlinkUserReturn {
	/** Whether a request is in flight. Stays true after a success: the surface is going away. */
	isDisconnecting: boolean;
	/** The failure message, or an empty string. */
	error: string;
	/** Runs the unlink. Resolves true when it succeeded. */
	unlink: ( options: UnlinkOptions ) => Promise< boolean >;
}

/**
 * Run a user unlink and track its progress, for the dialogs that offer one.
 *
 * The request and the store update live in the `unlinkUser` thunk; this is the busy and
 * error state around them, so each dialog is left with only its own copy and actions.
 *
 * @return {UseUnlinkUserReturn} Progress of the unlink, and a function to run it.
 */
export default function useUnlinkUser(): UseUnlinkUserReturn {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ error, setError ] = useState( '' );
	const { unlinkUser } = useDispatch( STORE_ID );

	const unlink = useCallback(
		async ( { force = false, disconnectAllUsers = false, errorMessage }: UnlinkOptions ) => {
			setIsDisconnecting( true );
			setError( '' );

			try {
				await unlinkUser( { force, disconnectAllUsers } );
				return true;
			} catch {
				setError( errorMessage );
				setIsDisconnecting( false );
				return false;
			}
		},
		[ unlinkUser ]
	);

	return { isDisconnecting, error, unlink };
}
