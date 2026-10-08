import { getScriptData } from '@automattic/jetpack-script-data';
import {
	AnalyticsQueryClientProvider,
	useStatsSettings,
	type StatsSettings,
} from '@jetpack-premium-analytics/data';
import {
	Card,
	DataForm,
	Link,
	Notice,
	Spinner,
	Stack,
	Text,
	VisuallyHidden,
	type Form,
} from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { PlanUsageCard } from './plan-usage-card';
import { getFields } from './stats-settings-fields';
import styles from './stats-settings.module.scss';
import type { JSX } from 'react';

type CardGroup = { id: string; label: string; children: string[] };

/**
 * The form's cards and the fields each one holds.
 *
 * @return The cards, in order.
 */
const getCardGroups = (): CardGroup[] => [
	{
		id: 'admin-bar',
		label: __( 'Admin bar widget', 'jetpack-premium-analytics-pkg' ),
		children: [ 'admin_bar' ],
	},
	{
		id: 'permissions',
		label: __( 'Manage permissions', 'jetpack-premium-analytics-pkg' ),
		children: [ 'roles', 'count_roles' ],
	},
	{
		id: 'reader',
		label: __( 'WordPress.com Reader', 'jetpack-premium-analytics-pkg' ),
		children: [ 'wpcom_reader_views_enabled' ],
	},
];

// apiFetch writes these itself when the request never reached the site.
const CLIENT_ERROR_CODES = [ 'fetch_error', 'offline_error' ];

/**
 * The reason the site gave for refusing a save, when it gave one.
 *
 * @param error - What apiFetch rejected with: the site's REST error body, or a client-side error.
 * @return The site's message, or null.
 */
function getSiteErrorMessage( error: unknown ): string | null {
	const { code, message } = ( error ?? {} ) as { code?: unknown; message?: unknown };
	return typeof code === 'string' &&
		! CLIENT_ERROR_CODES.includes( code ) &&
		typeof message === 'string'
		? message
		: null;
}

/**
 * The dashboard's Settings tab: the plan usage, the Stats settings, and where to switch Stats off.
 *
 * @return The Settings tab content.
 */
export function StatsSettingsPanel(): JSX.Element {
	const premiumAnalytics = getScriptData()?.premium_analytics;
	const roles = premiumAnalytics?.stats_settings?.roles;
	const featuresUrl = premiumAnalytics?.stats_settings?.features_url;
	const fields = useMemo( () => getFields( roles ?? [] ), [ roles ] );
	const cardGroups = useMemo( getCardGroups, [] );
	const formLayout = useMemo< Form >(
		() => ( { layout: { type: 'card', isCollapsible: false }, fields: cardGroups } ),
		[ cardGroups ]
	);

	const { settings, isError, saveChange } = useStatsSettings();
	const trackEvent = useTrackEvent();
	const { createSuccessNotice, createErrorNotice } = useDispatch( 'core/notices' );

	const onChange = useCallback(
		async ( edits: Partial< StatsSettings > ) => {
			try {
				await saveChange( edits );
			} catch ( error ) {
				const reason = getSiteErrorMessage( error );
				createErrorNotice(
					reason
						? sprintf(
								/* translators: %s: the reason the site gave. */
								__( 'Your Stats settings could not be saved: %s', 'jetpack-premium-analytics-pkg' ),
								reason
							)
						: __( 'Your Stats settings could not be saved.', 'jetpack-premium-analytics-pkg' ),
					{ type: 'snackbar' }
				);
				return;
			}
			trackEvent( 'jetpack_premium_analytics_settings_save', {
				settings: Object.keys( edits ).join( ',' ),
			} );
			createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
				type: 'snackbar',
			} );
		},
		[ createErrorNotice, createSuccessNotice, saveChange, trackEvent ]
	);

	let form: JSX.Element;
	if ( settings ) {
		form = (
			<DataForm data={ settings } fields={ fields } form={ formLayout } onChange={ onChange } />
		);
	} else if ( isError ) {
		form = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						'Your Stats settings could not be loaded. Reload the page to try again.',
						'jetpack-premium-analytics-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	} else {
		// DataForm has no loading state, so draw its cards from the same form config until the data arrives.
		form = (
			<Stack direction="column" gap="xl" aria-busy="true">
				<VisuallyHidden role="status">
					{ __( 'Loading your Stats settings…', 'jetpack-premium-analytics-pkg' ) }
				</VisuallyHidden>
				{ cardGroups.map( group => (
					<Card.Root key={ group.id }>
						<Card.Header>
							<Card.Title>{ group.label }</Card.Title>
						</Card.Header>
						<Card.Content>
							<Spinner />
						</Card.Content>
					</Card.Root>
				) ) }
			</Stack>
		);
	}

	return (
		<Stack direction="column" gap="xl" className={ styles.root }>
			{ /* Outside any widget, so outside the provider `WidgetRoot` mounts for widgets. */ }
			<AnalyticsQueryClientProvider>
				<PlanUsageCard />
			</AnalyticsQueryClientProvider>
			{ form }
			{ featuresUrl && (
				<Card.Root>
					<Card.Header>
						<Card.Title>{ __( 'Activation', 'jetpack-premium-analytics-pkg' ) }</Card.Title>
					</Card.Header>
					<Card.Content>
						<Text>
							{ createInterpolateElement(
								__(
									'Stats is a Jetpack feature. Activate or deactivate it from <link>Jetpack features</link>.',
									'jetpack-premium-analytics-pkg'
								),
								{ link: <Link href={ featuresUrl } /> }
							) }
						</Text>
					</Card.Content>
				</Card.Root>
			) }
		</Stack>
	);
}
