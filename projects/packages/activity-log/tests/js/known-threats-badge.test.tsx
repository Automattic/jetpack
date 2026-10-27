import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import {
	ActivityEvent,
	KnownThreatsBadge,
} from '../../src/js/components/ActivityLog/ActivityEvent';
import { knownThreatsQuery } from '../../src/js/hooks/use-known-threats';
import type { Activity } from '../../src/js/components/ActivityLog/types';

const SUMMARY = { malware: 2, database: 0, vulnerable: 0, ignored: 0, flagged: 2, fixed: 0 };

/**
 * A query client that knows the backup at 1792244435 has two threats.
 *
 * @return The client.
 */
function clientWithThreats() {
	const client = new QueryClient();
	client.setQueryData( knownThreatsQuery().queryKey, [
		{ period: 1792244301, known_threats: SUMMARY },
	] );
	return client;
}

describe( 'KnownThreatsBadge', () => {
	it( 'keeps its screen reader sentence in phrasing markup', () => {
		const client = clientWithThreats();
		const activity = {
			activityIsRewindable: true,
			activityName: 'rewind__backup_complete_full',
			rewindId: '1792244435.274',
		} as Activity;

		render(
			<QueryClientProvider client={ client }>
				<span>
					<KnownThreatsBadge activity={ activity } />
				</span>
			</QueryClientProvider>
		);

		const sentence = screen.getByText(
			'This backup is known to contain 2 security threats. Restoring it may bring malware back to your site.'
		);
		// Inside the badge's span, so a div would be invalid markup.
		expect( sentence.tagName ).toBe( 'SPAN' );
	} );

	it( 'starts on its own line under the title in the Table cell', () => {
		const activity = {
			activityIsRewindable: true,
			activityName: 'rewind__backup_complete_full',
			activityTitle: 'Backup and scan complete',
			activityDescription: { items: [ '30 plugins, 3 themes' ] },
			rewindId: '1792244435.274',
		} as Activity;

		render(
			<QueryClientProvider client={ clientWithThreats() }>
				<ActivityEvent activity={ activity } />
			</QueryClientProvider>
		);

		const badges = screen.getAllByText( 'Known threats (2)' );
		expect( badges ).toHaveLength( 1 );
		// A sibling of the title, not inside the description beside it. The
		// layout is the point of this test, so it walks the DOM.
		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = badges[ 0 ].closest( '.site-activity-logs__event-badge' );
		// eslint-disable-next-line testing-library/no-node-access
		expect( wrapper?.parentElement ).toHaveClass( 'site-activity-logs__event-content' );
	} );
} );
