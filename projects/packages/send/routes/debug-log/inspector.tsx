import { useCallback, useEffect } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import { DEBUG_EVENT_PARAM, entryId } from '../../_inc/data/log-link';
import { useSendStatus } from '../../_inc/data/store';
import DebugEntryPanel from '../../_inc/screens/debug-log/entry-panel';

/**
 * The debug log's side panel: the entry named by `event`, beside the list.
 *
 * @return The panel, or nothing.
 */
const Inspector = () => {
	// `@wordpress/route` types no route tree, so the navigate argument needs a cast.
	const search: Record< string, unknown > = useSearch( { strict: false } );
	const navigate = useNavigate();
	const id = entryId( search?.[ DEBUG_EVENT_PARAM ] );
	const close = useCallback(
		( replace = false ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ DEBUG_EVENT_PARAM ]: undefined,
				} ),
				replace,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);
	const onClose = useCallback( () => close(), [ close ] );

	// Without an account the route shows setup, so an old link has nothing to open beside it.
	const { status } = useSendStatus();
	const orphaned = !! id && !! status && ! status.account;
	useEffect( () => {
		if ( orphaned ) {
			close( true );
		}
	}, [ orphaned, close ] );

	return id && ! orphaned ? <DebugEntryPanel id={ id } onClose={ onClose } /> : null;
};

export { Inspector as inspector };
