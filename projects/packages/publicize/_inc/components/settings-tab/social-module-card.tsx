import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import useToggleSocialModule from './use-toggle-social-module';

/**
 * Master on/off for the Social (Publicize) module, surfaced at the top of the
 * Settings tab so the module can be turned back off from within the product.
 * Pairs with `PublicizeInactiveEmptyState` (the enable surface shown when it's
 * off). Present because the wp-admin module-toggles surface is unreachable on
 * some hosts — WordPress.com Atomic sites on the Calypso interface — so relying
 * on it (umbrella #48824) leaves those users unable to toggle Social at all.
 *
 * @return The card.
 */
export default function SocialModuleCard(): JSX.Element {
	const { isModuleActive, isUpdating, toggleModule } = useToggleSocialModule();

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Auto-share to social media', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __(
						'Automatically share your posts to your connected social accounts',
						'jetpack-publicize-pkg'
					) }
					checked={ isModuleActive }
					disabled={ isUpdating }
					onChange={ toggleModule }
					help={ __(
						'When off, the Social tools stay available here but your posts won’t be shared automatically.',
						'jetpack-publicize-pkg'
					) }
				/>
			</Card.Content>
		</Card.Root>
	);
}
