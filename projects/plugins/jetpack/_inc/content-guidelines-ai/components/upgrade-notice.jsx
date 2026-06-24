import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { Notice } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { recordAiEvent } from '../lib/tracks';

export default function UpgradeNotice() {
	const { hasFeature } = useAiFeature();
	const { checkoutUrl } = useAICheckout();
	const [ isDismissed, setIsDismissed ] = useState( false );

	const handleUpgradeClick = useCallback( () => {
		recordAiEvent( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	}, [] );

	const handleClose = useCallback( () => {
		setIsDismissed( true );
	}, [] );

	if ( hasFeature || isDismissed ) {
		return null;
	}

	const actions = checkoutUrl
		? [
				<Button
					key="upgrade"
					variant="primary"
					href={ checkoutUrl }
					target="_blank"
					onClick={ handleUpgradeClick }
				>
					{ __( 'Upgrade', 'jetpack' ) }
				</Button>,
		  ]
		: undefined;

	return (
		<div className="jetpack-content-guidelines-ai__upgrade-notice">
			<Notice level="success" onClose={ handleClose } actions={ actions }>
				{ __(
					'Not sure where to start? Jetpack can read your site and suggest guidelines tailored to your content. Upgrade to get started.',
					'jetpack'
				) }
			</Notice>
		</div>
	);
}
