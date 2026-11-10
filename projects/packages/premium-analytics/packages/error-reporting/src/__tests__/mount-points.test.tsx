import { stage as authorDetail } from '../../../../routes/author-detail/stage';
import { stage as connect } from '../../../../routes/connect/stage';
import { stage as dashboard } from '../../../../routes/dashboard/stage';
import { stage as reports } from '../../../../routes/reports/stage';
import { stage as singleReport } from '../../../../routes/single-report/stage';
import { stage as upgrade } from '../../../../routes/upgrade/stage';
import { StatsErrorBoundary } from '../stats-error-boundary';
import type { ReactElement } from 'react';

describe( 'route stages', () => {
	it.each( [
		[ 'author-detail', authorDetail ],
		[ 'connect', connect ],
		[ 'dashboard', dashboard ],
		[ 'reports', reports ],
		[ 'single-report', singleReport ],
		[ 'upgrade', upgrade ],
	] )( 'wraps %s in StatsErrorBoundary', ( _name, stage: () => ReactElement ) => {
		expect( stage().type ).toBe( StatsErrorBoundary );
	} );
} );
