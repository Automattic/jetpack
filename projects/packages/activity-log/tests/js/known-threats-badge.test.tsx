import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { KnownThreatsBadge } from '../../src/js/components/ActivityLog/ActivityEvent';
import { knownThreatsQuery } from '../../src/js/hooks/use-known-threats';
import type { Activity } from '../../src/js/components/ActivityLog/types';

const SUMMARY = { malware: 2, database: 0, vulnerable: 0, ignored: 0, flagged: 2, fixed: 0 };

describe( 'KnownThreatsBadge', () => {
	it( 'keeps its screen reader sentence in phrasing markup', () => {
		const client = new QueryClient();
		client.setQueryData( knownThreatsQuery().queryKey, [
			{ period: 1792244301, known_threats: SUMMARY },
		] );
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
} );
