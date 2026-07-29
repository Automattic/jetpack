import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Button, Card, Stack } from '@wordpress/ui';
import CardHeaderIcon from './card-header-icon';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: OverviewResponse[ 'site_visibility' ];
	onManage: () => void;
}

// Labels resolved at module scope so the production minifier can't fold an
// adjacent `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which would erase
// the literals from i18n extraction. See feedback_i18n_ternary_minifier_fold.
const searchAllowedLabel = __( 'Search engines allowed', 'jetpack-seo' );
const searchBlockedLabel = __( 'Search engines blocked', 'jetpack-seo' );
const sitemapActiveLabel = __( 'Sitemap active', 'jetpack-seo' );
const sitemapDisabledLabel = __( 'Sitemap disabled', 'jetpack-seo' );
const seoToolsActiveLabel = __( 'SEO tools active', 'jetpack-seo' );
const seoToolsInactiveLabel = __( 'SEO tools inactive', 'jetpack-seo' );

const SiteVisibilityCard: FC< Props > = ( { data, onManage } ) => {
	// A sitemap can't be generated or served while search engines are blocked, so
	// reflect the effective state (matches the gated Settings toggle): show it off
	// when indexing is off, and suppress the link/hint.
	const sitemapActive = data.sitemap_active && data.search_engines_visible;

	return (
		<Card.Root>
			<CardHeaderIcon icon={ seen } title={ __( 'Site visibility', 'jetpack-seo' ) } />
			<Stack render={ <Card.Content /> } direction="column" className={ styles.cardContent }>
				<Stack direction="column" gap="xs">
					<StatusDot
						status={ data.search_engines_visible ? 'ok' : 'err' }
						label={ data.search_engines_visible ? searchAllowedLabel : searchBlockedLabel }
					/>
					<StatusDot
						status={ sitemapActive ? 'ok' : 'warn' }
						label={ sitemapActive ? sitemapActiveLabel : sitemapDisabledLabel }
					/>
					<StatusDot
						status={ data.seo_tools_active ? 'ok' : 'warn' }
						label={ data.seo_tools_active ? seoToolsActiveLabel : seoToolsInactiveLabel }
					/>
				</Stack>
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="solid" size="compact" onClick={ onManage }>
						{ __( 'Manage visibility', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Stack>
		</Card.Root>
	);
};

export default SiteVisibilityCard;
