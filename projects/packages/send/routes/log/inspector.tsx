import { useCallback, useEffect } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { LOG_ENTRY_PARAM, entryId } from '../../_inc/data/log-link';
import { useSendStatus } from '../../_inc/data/store';
import EmailPanel from '../../_inc/screens/log/email-preview';

/**
 * The Log's side panel: the email named by `entry`, beside the list.
 *
 * @return The panel, or nothing.
 */
const Inspector = () => {
	// `@wordpress/route` types no route tree, so the navigate argument needs a cast.
	const search: Record< string, unknown > = useSearch( { strict: false } );
	const navigate = useNavigate();
	const id = entryId( search?.[ LOG_ENTRY_PARAM ] );
	const close = useCallback(
		( replace = false ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ LOG_ENTRY_PARAM ]: undefined,
				} ),
				replace,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);
	const onClose = useCallback( () => close(), [ close ] );

	// Without an account the Log shows setup, so an old link has nothing to open beside it.
	const { status } = useSendStatus();
	const orphaned = !! id && !! status && ! status.account;
	useEffect( () => {
		if ( orphaned ) {
			close( true );
		}
	}, [ orphaned, close ] );

	return id && ! orphaned ? <EmailPanel id={ id } onClose={ onClose } /> : null;
};

export { Inspector as inspector };
