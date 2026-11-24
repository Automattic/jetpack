import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { FC } from 'react';

interface Props {
	/** Turn SEO tools on. */
	onTurnOn: () => void;
	/** Whether a save is in flight. */
	disabled: boolean;
	/** Whether SEO tools are being turned on. */
	loading: boolean;
}

/**
 * Tops Settings while the `seo-tools` module is off: what is paused, and the way back on.
 *
 * @param props          - Component props.
 * @param props.onTurnOn - Turn SEO tools on.
 * @param props.disabled - Whether a save is in flight.
 * @param props.loading  - Whether SEO tools are being turned on.
 * @return The notice.
 */
const SeoToolsOffNotice: FC< Props > = ( { onTurnOn, disabled, loading } ) => {
	return (
		<Notice.Root intent="info">
			<Notice.Title>{ __( 'SEO tools are off', 'jetpack-seo' ) }</Notice.Title>
			<Notice.Description>
				{ __(
					'Custom titles and descriptions, structured data, share images, llms.txt, AI crawler rules, IndexNow, and the AI SEO Enhancer are paused. Your sitemap, site verification, and canonical URLs keep working.',
					'jetpack-seo'
				) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton onClick={ onTurnOn } loading={ loading } disabled={ disabled }>
					{ __( 'Turn on SEO tools', 'jetpack-seo' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
};

export default SeoToolsOffNotice;
