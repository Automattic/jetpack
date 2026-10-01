import { store as blockEditorStore, useBlockEditContext } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { dispatch, select, subscribe, useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import '@wordpress/notices';

const ORIGIN_BLOCK_KEY = 'jetpackStripeConnectOriginBlock';

let result = null;
let originBlock = null;

/**
 * Remembers which block started the Stripe connection, so the result can be shown inside it.
 * Client IDs don't survive the redirect, so the block is stored as its name and position.
 *
 * @param {string} clientId - Client ID of the block whose connect button was clicked.
 */
export function rememberStripeConnectOrigin( clientId ) {
	const { getBlockName, getBlocksByName } = select( blockEditorStore );
	const name = getBlockName( clientId );
	if ( ! name ) {
		return;
	}
	try {
		window.sessionStorage.setItem(
			ORIGIN_BLOCK_KEY,
			JSON.stringify( { name, index: getBlocksByName( name ).indexOf( clientId ) } )
		);
	} catch {
		// Storage unavailable; the result falls back to the editor-wide notice.
	}
}

/**
 * Resolves the block that started the connection, if it's still in the post.
 *
 * @param {Function} selectFn - Registry select function.
 * @return {string|undefined} Client ID.
 */
function getOriginClientId( selectFn ) {
	return originBlock
		? selectFn( blockEditorStore ).getBlocksByName( originBlock.name )[ originBlock.index ]
		: undefined;
}

/**
 * Shows the Stripe connection result inside the block that started it.
 *
 * @return {Element|null} The notice, or null for every other block.
 */
export function StripeConnectionNotice() {
	const { clientId } = useBlockEditContext();
	const isOrigin = useSelect( s => !! result && getOriginClientId( s ) === clientId, [ clientId ] );
	const [ isDismissed, setIsDismissed ] = useState( false );
	const { selectBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( isOrigin ) {
			selectBlock( clientId );
		}
	}, [ isOrigin, clientId, selectBlock ] );

	if ( ! isOrigin || isDismissed ) {
		return null;
	}

	return (
		<Notice status={ result.status } onRemove={ () => setIsDismissed( true ) }>
			{ result.message }
		</Notice>
	);
}

if ( 'undefined' !== typeof window && window.location ) {
	const query = new URLSearchParams( window.location.search );

	if ( query.get( 'stripe_connect_success' ) ) {
		result = {
			status: 'success',
			message: __(
				'Congrats! Your site is now connected to Stripe. You can now start accepting funds!',
				'jetpack'
			),
		};
	} else if ( query.get( 'stripe_connect_cancelled' ) ) {
		result = {
			status: 'error',
			message: __( 'You cancelled connecting your site to Stripe.', 'jetpack' ),
		};
	}

	// Cleared on every load, so an abandoned connection can't attach a later result to a stale block.
	try {
		originBlock = JSON.parse( window.sessionStorage.getItem( ORIGIN_BLOCK_KEY ) );
		window.sessionStorage.removeItem( ORIGIN_BLOCK_KEY );
	} catch {
		originBlock = null;
	}

	// Without a stored origin block that's still in the post, keep the editor-wide notice.
	if ( result ) {
		const unsubscribe = subscribe( () => {
			if ( ! select( 'core/editor' )?.__unstableIsEditorReady?.() ) {
				return;
			}
			unsubscribe();
			if ( ! getOriginClientId( select ) ) {
				dispatch( 'core/notices' ).createNotice( result.status, result.message );
			}
		} );
	}
}
