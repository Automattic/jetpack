/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useNavigate } from 'react-router';
import { JetpackSeoRoutes, JetpackSeoSections } from '../../constants';
import CardSkeleton from './card-skeleton';
import OverviewCard from './overview-card';
import SeverityDot from './severity-dot';
import type { Severity } from './severity-dot';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC, MouseEvent } from 'react';

interface Props {
	data?: OverviewResponse[ 'site_visibility' ];
}

interface Row {
	id: string;
	label: string;
	severity: Severity;
}

const visibilityHref = `${ JetpackSeoRoutes.Settings }#${ JetpackSeoSections.Visibility }`;

const SiteVisibilityCard: FC< Props > = ( { data } ) => {
	const navigate = useNavigate();

	if ( ! data ) {
		return <CardSkeleton title={ __( 'Site visibility', 'jetpack-seo' ) } />;
	}

	const rows: Row[] = [
		{
			id: 'engines',
			label: data.search_engines_visible
				? __( 'Search engines allowed', 'jetpack-seo' )
				: __( 'Search engines blocked', 'jetpack-seo' ),
			severity: data.search_engines_visible ? 'healthy' : 'critical',
		},
		{
			id: 'sitemap',
			label: data.sitemap_active
				? __( 'Sitemap active', 'jetpack-seo' )
				: __( 'Sitemap disabled', 'jetpack-seo' ),
			severity: data.sitemap_active ? 'healthy' : 'critical',
		},
		{
			id: 'tools',
			label: data.seo_tools_active
				? __( 'Jetpack SEO tools active', 'jetpack-seo' )
				: __( 'Jetpack SEO tools inactive', 'jetpack-seo' ),
			severity: data.seo_tools_active ? 'healthy' : 'moderate',
		},
	];

	let heading: string;
	if ( ! data.search_engines_visible ) {
		heading = __( 'Blocked', 'jetpack-seo' );
	} else if ( data.sitemap_active ) {
		heading = __( 'Healthy', 'jetpack-seo' );
	} else {
		heading = __( 'Needs attention', 'jetpack-seo' );
	}

	const description =
		data.search_engines_visible && data.sitemap_active
			? __( 'Search engines can crawl the site and the sitemap is being published.', 'jetpack-seo' )
			: __( 'Review the checklist in the SEO guide above.', 'jetpack-seo' );

	const goToSettings = ( event: MouseEvent< HTMLAnchorElement > ) => {
		event.preventDefault();
		navigate( visibilityHref );
	};

	return (
		<OverviewCard
			title={ __( 'Site visibility', 'jetpack-seo' ) }
			heading={ heading }
			description={ description }
			body={
				<Stack direction="column" gap="sm">
					{ rows.map( row => (
						<Stack key={ row.id } direction="row" gap="md" align="flex-start">
							<span
								// Match the body-md line-box so the dot sits
								// mid-line with the label — same treatment
								// used in the SEO guide list.
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									height: 'var(--wpds-typography-line-height-sm, 20px)',
								} }
							>
								<SeverityDot severity={ row.severity } />
							</span>
							<Text variant="body-md">{ row.label }</Text>
						</Stack>
					) ) }
				</Stack>
			}
			footer={
				<Stack direction="row" justify="flex-end">
					<Link href={ visibilityHref } onClick={ goToSettings }>
						{ __( 'Visibility settings', 'jetpack-seo' ) }
					</Link>
				</Stack>
			}
		/>
	);
};

export default SiteVisibilityCard;
