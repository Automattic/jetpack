import { __ } from '@wordpress/i18n';
import { tool } from '@wordpress/icons';
import { Card, CollapsibleCard, SwitchControl } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import useSeoToolsSwitch from '../../data/use-seo-tools-switch';
import type { FC } from 'react';

const seoToolsHelp = __(
	'Controls custom titles and descriptions, structured data, share images, llms.txt, AI crawler rules, IndexNow, and the AI SEO Enhancer. Your sitemap, site verification, and canonical URLs work either way.',
	'jetpack-seo'
);

interface Props {
	/** Whether the `seo-tools` module is on. */
	active: boolean;
}

/**
 * The `seo-tools` module's switch, last on Settings.
 *
 * @param props        - Component props.
 * @param props.active - Whether the `seo-tools` module is on.
 * @return The SEO tools card.
 */
const SeoToolsCard: FC< Props > = ( { active } ) => {
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
					checked={ active }
					onCheckedChange={ setActive }
					disabled={ isSwitching }
				/>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SeoToolsCard;
