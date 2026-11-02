import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import Card from 'components/card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

/**
 * A search result that sends a setting to the page that now holds it.
 *
 * @param {object}                    props          - Component props.
 * @param {string}                    props.header   - Card header.
 * @param {string}                    props.href     - The page that holds the setting.
 * @param {string}                    props.linkText - Link text.
 * @param {import('react').ReactNode} props.children - What moved, and where.
 * @return {import('react').ReactNode} The card.
 */
export default function PointerCard( { header, href, linkText, children } ) {
	return (
		<SettingsCard header={ header } hideButton>
			<SettingsGroup>{ children }</SettingsGroup>
			<Card compact className="jp-settings-card__configure-link" href={ href }>
				{ linkText }
			</Card>
		</SettingsCard>
	);
}

/**
 * A search result that sends a product's settings to its card in My Jetpack › Features.
 *
 * @param {object} props        - Component props.
 * @param {string} props.header - Card header.
 * @param {string} props.name   - Product name.
 * @param {string} props.search - Search term that finds the product in Features.
 * @return {import('react').ReactNode} The card.
 */
export function FeaturesPointer( { header, name, search } ) {
	return (
		<PointerCard
			header={ header }
			href={ getAdminUrl(
				`admin.php?page=my-jetpack#/features?search=${ encodeURIComponent( search ) }`
			) }
			linkText={ __( 'Open Features', 'jetpack' ) }
		>
			{ sprintf(
				/* translators: %s: a product name, such as VideoPress. */
				__( 'Turn %s on or off in My Jetpack › Features, which links to its settings.', 'jetpack' ),
				name
			) }
		</PointerCard>
	);
}
