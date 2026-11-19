import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import useSeoToolsSwitch from '../../data/use-seo-tools-switch';
import type { FC } from 'react';

/**
 * Tops Settings while the `seo-tools` module is off: what is paused, and the way back on.
 *
 * @return The notice.
 */
const SeoToolsOffNotice: FC = () => {
	const { isSwitching, setActive } = useSeoToolsSwitch( 'settings' );
	const turnOn = useCallback( () => setActive( true ), [ setActive ] );

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
				<Notice.ActionButton onClick={ turnOn } loading={ isSwitching } disabled={ isSwitching }>
					{ __( 'Turn on SEO tools', 'jetpack-seo' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
};

export default SeoToolsOffNotice;
