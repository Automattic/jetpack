import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';

/**
 * Customize links card — UTM parameter appending toggle.
 *
 * Replaces the legacy `UtmToggle` for the chassis Settings tab. The
 * detailed UTM-parameter editor that ships behind the toggle today
 * lives further down the legacy `SocialModuleToggle` tree; the chassis
 * surfaces the on/off and the explainer for now and leaves the editor
 * for a follow-up if/when product wants it on the new surface.
 *
 * @return The card.
 */
export default function CustomizeLinksCard(): JSX.Element {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		return {
			isEnabled: store.getSocialSettings().utmSettings.enabled,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { updateUtmSettings } = useDispatch( socialStore );

	const onToggle = useCallback(
		( next: boolean ) => {
			updateUtmSettings( { enabled: next } );
		},
		[ updateUtmSettings ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Customize links', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Append UTM parameters to shared URLs', 'jetpack-publicize-pkg' ) }
					checked={ isEnabled }
					disabled={ isUpdating }
					onChange={ onToggle }
					help={ __(
						"UTM parameters are tags added to links to help track where website visitors come from, improving our understanding of how content is shared. Don't worry, it doesn't change the experience or the link destination!",
						'jetpack-publicize-pkg'
					) }
				/>
			</Card.Content>
		</Card.Root>
	);
}
