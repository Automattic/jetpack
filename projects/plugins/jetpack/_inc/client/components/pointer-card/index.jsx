import Card from 'components/card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

/**
 * A settings card that holds no settings, only a link to where they now live.
 *
 * @param {object}                    props          - Component props.
 * @param {string}                    props.header   - The card heading.
 * @param {string}                    props.href     - Where the settings are now.
 * @param {string}                    props.linkText - The link text.
 * @param {import('react').ReactNode} props.children - What moved and why.
 * @return {import('react').ReactNode} The card.
 */
export const PointerCard = ( { header, href, linkText, children } ) => (
	<SettingsCard header={ header } hideButton>
		<SettingsGroup>{ children }</SettingsGroup>
		<Card compact className="jp-settings-card__configure-link" href={ href }>
			{ linkText }
		</Card>
	</SettingsCard>
);
