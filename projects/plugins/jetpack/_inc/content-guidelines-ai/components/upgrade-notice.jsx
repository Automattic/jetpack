import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { config } from '../constants';
import { AI_STORE_NAME } from '../store';

export default function UpgradeNotice() {
	const visible = useSelect( select => select( AI_STORE_NAME ).isUpgradeNoticeVisible(), [] );
	const { hideUpgradeNotice } = useDispatch( AI_STORE_NAME );

	const handleDismiss = useCallback( () => {
		hideUpgradeNotice();
	}, [ hideUpgradeNotice ] );

	if ( ! visible ) {
		return null;
	}

	return (
		<Notice
			status="warning"
			onRemove={ handleDismiss }
			className="jetpack-content-guidelines-ai__upgrade-notice"
		>
			<p>
				{ __(
					"You've reached your limit for AI-generated suggestions. Upgrade to improve your guidelines, generate images, and unlock the full Jetpack AI Assistant.",
					'jetpack'
				) }
			</p>
			{ config.upgradeUrl && (
				<Button variant="primary" href={ config.upgradeUrl }>
					{ __( 'View plans', 'jetpack' ) }
				</Button>
			) }
		</Notice>
	);
}
