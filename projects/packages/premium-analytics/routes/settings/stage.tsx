/**
 * External dependencies
 */
import { Icon, JetpackFooter, Stack } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { StatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	DashboardSectionProvider,
	PageOptionsMenu,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { StatsSettingsPanel } from './components';
import styles from './stage.module.scss';
import type { JSX } from 'react';

// The dashboard redirects this section to the page, so a link out of it can return here.
const SETTINGS_ORIGIN = 'settings';

/**
 * Settings route stage: the plan usage, the Stats settings, and where to switch Stats off.
 *
 * @return The Settings page.
 */
export function stage(): JSX.Element {
	return (
		<Page
			visual={ <Icon icon={ jetpack } /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Settings', 'jetpack-premium-analytics-pkg' ) } ] }
				/>
			}
			actions={ <PageOptionsMenu /> }
			className={ styles.page }
		>
			<Stack direction="column" justify="space-between" className={ styles.scroll }>
				<DashboardSectionProvider section={ SETTINGS_ORIGIN }>
					<div className={ styles.body }>
						<StatsSettingsPanel />
					</div>
				</DashboardSectionProvider>

				<JetpackFooter />
			</Stack>
		</Page>
	);
}
