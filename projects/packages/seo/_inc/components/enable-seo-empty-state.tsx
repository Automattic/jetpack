import { __, sprintf } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
import getOutput from '../data/get-output';
import useEnableSeoTools from '../data/use-enable-seo-tools';
import styles from './enable-seo-empty-state.module.scss';
import type { SeoTracksScreen } from '../data/record-seo-event';
import type { FC } from 'react';

/**
 * Offer module activation while identifying any competing SEO provider.
 *
 * @param props        - Component props.
 * @param props.screen - The screen displaying the enable card.
 * @return The enable-SEO-tools empty state.
 */
const EnableSeoEmptyState: FC< { screen: SeoTracksScreen } > = ( { screen } ) => {
	const { isEnabling, enable } = useEnableSeoTools( screen );
	const { paused, conflicting_plugin: plugin } = getOutput();
	let description: string = __(
		'SEO tools help your content get found: customize titles and meta descriptions, generate a sitemap, verify your site with search engines, and control how pages look when shared. Turn it on to manage all of it from here.',
		'jetpack-seo'
	);

	if ( plugin ) {
		description = sprintf(
			/* translators: %s: name of an active SEO plugin, e.g. Yoast SEO. */
			__( '%s is active on this site.', 'jetpack-seo' ),
			plugin
		);
		if ( paused ) {
			description += ' ' + __( "Jetpack's overlapping SEO output is paused.", 'jetpack-seo' );
		}
	}

	return (
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Title>{ __( 'Enable SEO tools', 'jetpack-seo' ) }</EmptyState.Title>
			<EmptyState.Description>{ description }</EmptyState.Description>
			<EmptyState.Actions>
				<Button onClick={ enable } loading={ isEnabling } disabled={ isEnabling }>
					{ __( 'Enable SEO tools', 'jetpack-seo' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
};

export default EnableSeoEmptyState;
