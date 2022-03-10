/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { flashIcon } from '../../icons';
import useAutosaveAndRedirect from '../../use-autosave-and-redirect';
import analytics from '../../../../_inc/client/lib/analytics';

import './style.scss';

export default function StripeConnectToolbarGroup( { blockName, connectUrl, isVisible } ) {
	const { autosaveAndRedirect } = useAutosaveAndRedirect( connectUrl );

	if ( ! isVisible ) {
		return null;
	}

	const handleClick = event => {
		event.preventDefault();
		analytics.tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
			block: blockName,
		} );
		autosaveAndRedirect( event );
	};

	return (
		<ToolbarGroup>
			<ToolbarButton
				className="connect-stripe components-tab-button"
				icon={ flashIcon }
				onClick={ handleClick }
			>
				{ __( 'Connect Stripe', 'jetpack' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}
