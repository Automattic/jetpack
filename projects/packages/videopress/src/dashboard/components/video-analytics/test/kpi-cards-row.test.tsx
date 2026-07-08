import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KpiCardsRow from '../kpi-cards-row';
import type { VideoMetric, VideoStats } from '../../../types/stats';

const STATS: VideoStats = {
	views: { current: 1234, previousPeriod: 1000 },
	impressions: { current: 5678, previousPeriod: 5000 },
	watchTimeSeconds: { current: 7200, previousPeriod: 3600 },
	retentionRate: { current: 87.5, previousPeriod: 80 },
	series: [],
};

const TAB_IDS: Record< VideoMetric, string > = {
	views: 'tab-views',
	impressions: 'tab-impressions',
	watch_time: 'tab-watch-time',
	retention: 'tab-retention',
};

const renderRow = ( overrides: Partial< Parameters< typeof KpiCardsRow >[ 0 ] > = {} ) => {
	const onChangeActiveMetric = jest.fn();
	render(
		<KpiCardsRow
			stats={ STATS }
			isLoading={ false }
			activeMetric="views"
			onChangeActiveMetric={ onChangeActiveMetric }
			tabIds={ TAB_IDS }
			panelId="panel"
			{ ...overrides }
		/>
	);
	return { onChangeActiveMetric };
};

describe( 'KpiCardsRow (video analytics)', () => {
	it( 'renders all four metrics as a tablist with formatted values', () => {
		renderRow();

		const tabs = screen.getAllByRole( 'tab' );
		expect( tabs ).toHaveLength( 4 );

		// Accessible names concatenate the label and value text runs
		// without separators, e.g. "VIEWS1,23423%".
		expect( screen.getByRole( 'tab', { name: /VIEWS1,234/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /IMPRESSIONS5,678/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /WATCH TIME2\.0 h/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /RETENTION87\.5%/ } ) ).toBeInTheDocument();
	} );

	it( 'marks only the active metric as selected', () => {
		renderRow( { activeMetric: 'retention' } );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toHaveAttribute(
			'id',
			'tab-retention'
		);
	} );

	it( 'reports the retention tab through onChangeActiveMetric', async () => {
		const user = userEvent.setup();
		const { onChangeActiveMetric } = renderRow();

		await user.click( screen.getByRole( 'tab', { name: /RETENTION/ } ) );
		expect( onChangeActiveMetric ).toHaveBeenCalledWith( 'retention' );

		await user.click( screen.getByRole( 'tab', { name: /WATCH TIME/ } ) );
		expect( onChangeActiveMetric ).toHaveBeenCalledWith( 'watch_time' );
	} );

	it( 'replaces values with skeletons while loading', () => {
		renderRow( { isLoading: true } );

		expect( screen.queryByText( '1,234' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '87.5%' ) ).not.toBeInTheDocument();
	} );
} );
