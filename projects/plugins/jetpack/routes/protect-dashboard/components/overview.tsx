import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import sections from '../sections';
import type { DashboardContext } from '../sections/types';

/**
 * The Overview tab: each section's card.
 *
 * @param props - The dashboard context, without a section's state.
 * @return The tab.
 */
export default function Overview( props: Omit< DashboardContext, 'state' > ) {
	const state = window.jetpackProtectDashboard ?? {};
	const cards = sections.filter( section => section.OverviewCard );

	if ( ! cards.length ) {
		return <Text variant="body-md">{ __( 'There’s nothing to show yet.', 'jetpack' ) }</Text>;
	}

	return (
		<div className="jp-protect-dashboard__cards">
			{ cards.map( ( { key, OverviewCard: Card } ) => (
				<Card key={ key } { ...props } state={ state[ key ] } />
			) ) }
		</div>
	);
}
