/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { TierProp } from '../../../../store/wordpress-com/types';

export default function Upgrade( {
	onClick,
	type,
	placement = '',
	currentTier,
	upgradeUrl,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onClick?: ( event: any ) => void;
	type: string;
	placement?: string;
	currentTier?: TierProp;
	upgradeUrl: string;
} ) {
	const { tracks } = useAnalytics();

	const handleClick = useCallback(
		evt => {
			tracks.recordEvent( 'jetpack_ai_upgrade_button', { placement } );
			onClick?.( evt );
		},
		[ onClick, tracks, placement ]
	);

	const requestLimit = currentTier?.value && currentTier?.value !== 1 ? currentTier.limit : 20;

	const freeLimitUpgradePrompt = __(
		'You have reached the limit of <strong>20 free</strong> requests. <button>Upgrade to continue generating feedback.</button>',
		'jetpack'
	);
	const tierLimitUpgradePrompt = sprintf(
		/* translators: number is the request limit for the current tier/plan */
		__(
			'You have reached the limit of <strong>%d requests</strong>. <button>Upgrade to continue generating feedback.</button>',
			'jetpack'
		),
		requestLimit
	);

	const messageForVip = createInterpolateElement(
		__(
			"You've reached the Jetpack AI rate limit. <strong>Please reach out to your VIP account team.</strong>",
			'jetpack'
		),
		{
			strong: <strong />,
		}
	);

	const defaultUpgradeMessage = createInterpolateElement(
		requestLimit === 20 ? freeLimitUpgradePrompt : tierLimitUpgradePrompt,
		{
			strong: <strong />,
			button: <Button variant="link" onClick={ handleClick } href={ upgradeUrl } target="_blank" />,
		}
	);

	return <p>{ type === 'vip' ? messageForVip : defaultUpgradeMessage }</p>;
}
