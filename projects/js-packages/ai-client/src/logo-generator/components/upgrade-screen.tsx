/**
 * External dependencies
 */
import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { EVENT_PLACEMENT_FREE_USER_SCREEN, EVENT_UPGRADE } from '../constants.js';
import useLogoGenerator from '../hooks/use-logo-generator.js';
/**
 * Types
 */
import type React from 'react';

export const UpgradeScreen: React.FC< {
	onCancel: () => void;
	upgradeURL: string;
	reason: 'feature' | 'requests';
} > = ( { onCancel, upgradeURL, reason } ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;

	const upgradeMessageFeature = __(
		'Upgrade your Jetpack AI for access to logo generation. This upgrade will also increase the amount of monthly requests you can use in for all AI-powered features.',
		'jetpack-ai-client'
	);

	const upgradeMessageRequests = __(
		'Not enough requests left to generate a logo. Upgrade your Jetpack AI to increase the amount of requests you can use in all AI-powered features.',
		'jetpack-ai-client'
	);

	const upgradeInfoUrl = getRedirectUrl( 'ai-logo-generator-fair-usage-policy', {
		anchor: 'usage-limitations-and-upgrades',
	} );

	const { context } = useLogoGenerator();

	const handleUpgradeClick = () => {
		recordTracksEvent( EVENT_UPGRADE, { context, placement: EVENT_PLACEMENT_FREE_USER_SCREEN } );
		onCancel();
	};

	return (
		<div className="jetpack-ai-logo-generator-modal__notice-message-wrapper">
			<div className="jetpack-ai-logo-generator-modal__notice-message">
				<span className="jetpack-ai-logo-generator-modal__loading-message">
					{ reason === 'feature' ? upgradeMessageFeature : upgradeMessageRequests }
				</span>
				&nbsp;
				<Button variant="link" href={ upgradeInfoUrl } target="_blank">
					{ __( 'Learn more about Jetpack AI.', 'jetpack-ai-client' ) }
				</Button>
			</div>
			<div className="jetpack-ai-logo-generator-modal__notice-actions">
				<Button variant="tertiary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-ai-client' ) }
				</Button>
				<Button
					variant="primary"
					href={ upgradeURL }
					target="_blank"
					onClick={ handleUpgradeClick }
				>
					{ __( 'Upgrade', 'jetpack-ai-client' ) }
				</Button>
			</div>
		</div>
	);
};
