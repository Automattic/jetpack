import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { flashIcon } from '../../icons';
import useAutosaveAndRedirect from '../../use-autosave-and-redirect';

import './style.scss';

export default function StripeConnectToolbarButton( { blockName, connectUrl } ) {
	const { autosaveAndRedirect } = useAutosaveAndRedirect( connectUrl );
	const { tracks } = useAnalytics();

	const handleClick = event => {
		event.preventDefault();
		tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
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
