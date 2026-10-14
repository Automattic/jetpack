import { Link, type Field } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';
import { ChipSelectEdit } from './chip-select-edit';
import type { StatsSettings } from '@jetpack-premium-analytics/data';

type SiteRole = { slug: string; name: string; count: number | null };

const CONFIGURE_STATS_URL = 'https://jetpack.com/support/jetpack-stats/configure-jetpack-stats/';

// `Stats\Settings::update()` keeps this role whatever is sent, so the form never offers it.
const LOCKED_ROLE = 'administrator';

/**
 * The Settings tab's fields, over the roles this site has.
 *
 * @param roles - The site's roles, with how many users hold each.
 * @return The fields.
 */
export function getFields( roles: SiteRole[] ): Field< StatsSettings >[] {
	const elements = roles.map( role => ( {
		value: role.slug,
		// Sites with many users get no counts, since counting them is slow.
		label:
			role.count === null
				? role.name
				: sprintf(
						/* translators: 1: user role name, 2: number of users with that role. */
						__( '%1$s (%2$s)', 'jetpack-premium-analytics-pkg' ),
						role.name,
						formatMetricValue( role.count, 'number', { decimals: 0 } )
					),
	} ) );

	return [
		{
			id: 'admin_bar',
			type: 'boolean',
			Edit: 'toggle',
			label: __( 'Include a small chart in admin bar', 'jetpack-premium-analytics-pkg' ),
			description: (
				<>
					{ __(
						'Displays a 48-hour traffic snapshot and information on your site activity, including visitors and popular posts or pages.',
						'jetpack-premium-analytics-pkg'
					) }{ ' ' }
					<Link href={ `${ CONFIGURE_STATS_URL }#see-a-48-hour-traffic-snapshot` } openInNewTab>
						{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
					</Link>
				</>
			),
		},
		{
			id: 'roles',
			type: 'array',
			label: __( 'Allow Jetpack Stats to be viewed by', 'jetpack-premium-analytics-pkg' ),
			description: __( 'Administrators can always view stats.', 'jetpack-premium-analytics-pkg' ),
			elements: elements.filter( element => element.value !== LOCKED_ROLE ),
			getValue: ( { item } ) => item.roles.filter( role => role !== LOCKED_ROLE ),
			setValue: ( { value } ) => ( { roles: [ LOCKED_ROLE, ...value ] } ),
			Edit: ChipSelectEdit,
		},
		{
			id: 'count_roles',
			type: 'array',
			label: __( 'Count logged in page views from', 'jetpack-premium-analytics-pkg' ),
			description: (
				<>
					{ __(
						'Views from other logged-in users are not counted.',
						'jetpack-premium-analytics-pkg'
					) }{ ' ' }
					<Link href={ `${ CONFIGURE_STATS_URL }#manage-what-views-are-counted` } openInNewTab>
						{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
					</Link>
				</>
			),
			elements,
			Edit: ChipSelectEdit,
		},
		{
			id: 'wpcom_reader_views_enabled',
			type: 'boolean',
			Edit: 'toggle',
			label: __( 'Show post views for this site', 'jetpack-premium-analytics-pkg' ),
		},
	];
}
