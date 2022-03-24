/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { flashIcon } from '../../icons';
import useAutosaveAndRedirect from '../../use-autosave-and-redirect';
import analytics from '../../../../_inc/client/lib/analytics';

import './style.scss';

export default function StripeConnectToolbarButton( { blockName, connectUrl } ) {
	const { autosaveAndRedirect } = useAutosaveAndRedirect( connectUrl );

	const handleClick = event => {
		event.preventDefault();
		analytics.tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
			block: blockName,
		} );
		autosaveAndRedirect( event );
	};

	return (
		<ToolbarButton
			className="connect-stripe components-tab-button"
			icon={ flashIcon }
			onClick={ handleClick }
		>
			{ __( 'Connect Stripe', 'jetpack' ) }
		</ToolbarButton>
	);
}
