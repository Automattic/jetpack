import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
import useEnableSeoTools from '../data/use-enable-seo-tools';
import styles from './enable-seo-empty-state.module.scss';
import type { SeoTracksScreen } from '../data/record-seo-event';
import type { FC } from 'react';

/**
 * Shown when the `seo-tools` module is inactive. Explains what SEO tools do and
 * offers a one-click enable. Activating reloads the page so the rest of the SEO
 * surface comes online (see `useEnableSeoTools`).
 *
 * An `@wordpress/ui` `EmptyState` rather than a card: with the module off it is
 * the only thing on the page, centered under the header (see `SeoDisabledStage`).
 *
 * @param props        - Component props.
 * @param props.screen - The screen this renders on; it appears on every tab's module-off stage.
 * @return The enable-SEO-tools empty state.
 */
const EnableSeoEmptyState: FC< { screen: SeoTracksScreen } > = ( { screen } ) => {
	const { isEnabling, enable } = useEnableSeoTools( screen );

	return (
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Title>{ __( 'Enable SEO tools', 'jetpack-seo' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					'SEO tools help your content get found: customize titles and meta descriptions, generate a sitemap, verify your site with search engines, and control how pages look when shared. Turn it on to manage all of it from here.',
					'jetpack-seo'
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button onClick={ enable } loading={ isEnabling } disabled={ isEnabling }>
					{ __( 'Enable SEO tools', 'jetpack-seo' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
};

export default EnableSeoEmptyState;
