import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
import useEnableSeoTools from '../data/use-enable-seo-tools';
import styles from './enable-seo-empty-state.module.scss';
import type { SeoTracksScreen } from '../data/record-seo-event';
import type { FC } from 'react';

/**
 * Offer SEO activation, which reloads the page to register module-dependent controls.
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
					'SEO tools help your content get found: customize titles and meta descriptions, add structured data, and manage content discovery. Sitemap, site verification and visibility settings remain available separately.',
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
