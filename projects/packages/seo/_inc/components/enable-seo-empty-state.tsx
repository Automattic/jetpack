import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
import getOutput from '../data/get-output';
import useSeoToolsSwitch from '../data/use-seo-tools-switch';
import styles from './enable-seo-empty-state.module.scss';
import type { SeoTracksScreen } from '../data/record-seo-event';
import type { FC } from 'react';

/* translators: %s: name of an active SEO plugin, e.g. Yoast SEO. */
const pausedDescription = __(
	"%s is active on this site. Enabling Jetpack's SEO tools will not deactivate it, and overlapping SEO output will remain paused.",
	'jetpack-seo'
);
/* translators: %s: name of an active SEO plugin, e.g. Yoast SEO. */
const activeDescription = __(
	"%s is active on this site. Enabling Jetpack's SEO tools will not deactivate it.",
	'jetpack-seo'
);

/**
 * Offer module activation while identifying any competing SEO provider.
 *
 * @param props        - Component props.
 * @param props.screen - The screen displaying the enable card.
 * @return The enable-SEO-tools empty state.
 */
const EnableSeoEmptyState: FC< { screen: SeoTracksScreen } > = ( { screen } ) => {
	const { isSwitching, setActive } = useSeoToolsSwitch( screen );
	const enable = useCallback( () => setActive( true ), [ setActive ] );
	const { paused, conflicting_plugin: plugin } = getOutput();
	let description: string = __(
		'Enable SEO tools to edit titles, meta descriptions, structured data, social previews, llms.txt, and AI crawler access. You can manage search visibility, sitemaps, site verification, and canonical URLs separately in Settings.',
		'jetpack-seo'
	);

	if ( plugin ) {
		description = paused
			? sprintf( pausedDescription, plugin )
			: sprintf( activeDescription, plugin );
	}

	return (
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Title>{ __( 'Enable SEO tools', 'jetpack-seo' ) }</EmptyState.Title>
			<EmptyState.Description>{ description }</EmptyState.Description>
			<EmptyState.Actions>
				<Button onClick={ enable } loading={ isSwitching } disabled={ isSwitching }>
					{ __( 'Enable SEO tools', 'jetpack-seo' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
};

export default EnableSeoEmptyState;
