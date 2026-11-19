import { __ } from '@wordpress/i18n';
import { tool } from '@wordpress/icons';
import { Card, CollapsibleCard, SwitchControl } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import useSeoToolsSwitch from '../../data/use-seo-tools-switch';
import type { FC } from 'react';

const seoToolsHelp = __(
	'Turning this off pauses custom titles and descriptions, structured data, llms.txt, AI crawler rules, and IndexNow. Your sitemap, site verification, and canonical URLs keep working.',
	'jetpack-seo'
);

/**
 * The `seo-tools` module's switch, last on Settings while the module is on.
 *
 * @return The SEO tools card.
 */
const SeoToolsCard: FC = () => {
	const { isSwitching, setActive } = useSeoToolsSwitch( 'settings' );

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Card.Title>
					<CardTitleIcon icon={ tool } title={ __( 'SEO tools', 'jetpack-seo' ) } />
				</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<SwitchControl
					label={ __( 'Use SEO tools', 'jetpack-seo' ) }
					description={ seoToolsHelp }
					checked
					onCheckedChange={ setActive }
					disabled={ isSwitching }
				/>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SeoToolsCard;
