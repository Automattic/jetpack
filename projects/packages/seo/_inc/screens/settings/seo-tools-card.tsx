import { __ } from '@wordpress/i18n';
import { Card, SwitchControl } from '@wordpress/ui';
import useSeoToolsSwitch from '../../data/use-seo-tools-switch';
import type { FC } from 'react';

const seoToolsHelp = __(
	'Needed for custom titles and meta descriptions, structured data, share images, llms.txt, AI crawler rules, IndexNow, and the AI SEO Enhancer. Your sitemap, site verification, and canonical URLs work without it.',
	'jetpack-seo'
);

/**
 * The `seo-tools` module's switch, for the settings that need it.
 *
 * @param props        - Component props.
 * @param props.active - Whether the module is on.
 * @return The SEO tools card.
 */
const SeoToolsCard: FC< { active: boolean } > = ( { active } ) => {
	const { isSwitching, setActive } = useSeoToolsSwitch( 'settings' );

	return (
		<Card.Root>
			<Card.Content>
				<SwitchControl
					label={ __( 'SEO tools', 'jetpack-seo' ) }
					description={ seoToolsHelp }
					checked={ active }
					onCheckedChange={ setActive }
					disabled={ isSwitching }
				/>
			</Card.Content>
		</Card.Root>
	);
};

export default SeoToolsCard;
