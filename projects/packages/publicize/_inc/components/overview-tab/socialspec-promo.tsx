import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import type { JSX } from 'react';

/**
 * Promotes the social web profile until it is turned on or the notice is dismissed.
 *
 * @return The notice, or null.
 */
export default function SocialspecPromo(): JSX.Element | null {
	const { settings, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		return {
			settings: store.getSocialSettings().socialspec,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { updateSocialspecSettings } = useDispatch( socialStore );

	const onTurnOn = useCallback( () => {
		updateSocialspecSettings( { enabled: true } );
	}, [ updateSocialspecSettings ] );

	const onDismiss = useCallback( () => {
		updateSocialspecSettings( { promo_dismissed: true } );
	}, [ updateSocialspecSettings ] );

	if (
		! settings ||
		settings.available === false ||
		settings.enabled ||
		settings.promo_dismissed
	) {
		return null;
	}

	return (
		<Notice.Root intent="info" className="jetpack-social-overview__socialspec-promo">
			<Notice.Title>
				{ __( 'New: a profile for the open social web', 'jetpack-publicize-pkg' ) }
			</Notice.Title>
			<Notice.Description>
				{ __(
					'Let feed readers and social apps show this site like a profile, with its About page and the blogs it recommends. Only what is already public on your site is shared.',
					'jetpack-publicize-pkg'
				) }
			</Notice.Description>
			<Notice.Actions>
				<Button variant="solid" size="compact" disabled={ isUpdating } onClick={ onTurnOn }>
					{ __( 'Turn on', 'jetpack-publicize-pkg' ) }
				</Button>
				<Button variant="minimal" size="compact" disabled={ isUpdating } onClick={ onDismiss }>
					{ __( 'Not now', 'jetpack-publicize-pkg' ) }
				</Button>
			</Notice.Actions>
		</Notice.Root>
	);
}
