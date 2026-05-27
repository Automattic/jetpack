import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: OverviewResponse[ 'site_visibility' ];
}

const SiteVisibilityCard: FC< Props > = ( { data } ) => {
	const visibilityStatus = data.search_engines_visible ? 'ok' : 'err';
	const visibilityLabel = data.search_engines_visible
		? __( 'Search engines allowed', 'jetpack-seo' )
		: __( 'Search engines blocked', 'jetpack-seo' );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Site visibility', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<div className={ styles.statRow }>
					<StatusDot status={ visibilityStatus } label={ visibilityLabel } />
				</div>
				<div className={ styles.statRow }>
					<StatusDot
						status={ data.sitemap_active ? 'ok' : 'warn' }
						label={
							data.sitemap_active
								? __( 'Sitemap active', 'jetpack-seo' )
								: __( 'Sitemap disabled', 'jetpack-seo' )
						}
					/>
					{ data.sitemap_active && (
						<ExternalLink href={ data.sitemap_url }>{ __( 'View', 'jetpack-seo' ) }</ExternalLink>
					) }
				</div>
				<div className={ styles.statRow }>
					<StatusDot
						status={ data.seo_tools_active ? 'ok' : 'warn' }
						label={
							data.seo_tools_active
								? __( 'SEO tools active', 'jetpack-seo' )
								: __( 'SEO tools inactive', 'jetpack-seo' )
						}
					/>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default SiteVisibilityCard;
