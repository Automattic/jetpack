import { __ } from '@wordpress/i18n';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import sections from '../sections';
import type { DashboardContext } from '../sections/types';

/**
 * The Settings tab: each section's settings card, once Jetpack's settings have loaded.
 *
 * @param props - The dashboard context, without a section's state.
 * @return The tab.
 */
export default function SettingsTab( props: Omit< DashboardContext, 'state' > ) {
	const { settings, error, dismissError } = props.settings;
	const state = window.jetpackProtectDashboard ?? {};
	const cards = sections.filter( section => section.SettingsCard );

	if ( ! settings ) {
		return error ? (
			<Notice.Root intent="error">
				<Notice.Description>{ error }</Notice.Description>
			</Notice.Root>
		) : (
			<Stack direction="row" justify="center">
				<Spinner />
			</Stack>
		);
	}

	return (
		<div className="jp-protect-dashboard__cards">
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
					<Notice.CloseIcon onClick={ dismissError } />
				</Notice.Root>
			) }
			{ cards.length ? (
				cards.map( ( { key, SettingsCard: Card } ) => (
					<Card key={ key } { ...props } state={ state[ key ] } />
				) )
			) : (
				<Text variant="body-md">{ __( 'There’s nothing to set up yet.', 'jetpack' ) }</Text>
			) }
		</div>
	);
}
