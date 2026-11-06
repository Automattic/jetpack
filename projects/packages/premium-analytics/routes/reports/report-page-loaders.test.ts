import {
	REPORT_PAGE_LOADERS,
	getLoadedReportPage,
	getReportPageLoader,
	preloadReportPage,
} from './report-page-loaders';

describe( 'report page loaders', () => {
	it( 'makes a preloaded page synchronously available to the report stage', async () => {
		const ReportPage = () => null;
		const loader = jest.fn( async () => ( { default: ReportPage } ) );
		REPORT_PAGE_LOADERS.posts = loader;

		await preloadReportPage( 'posts' );
		await getReportPageLoader( 'posts' )?.();

		expect( getLoadedReportPage( 'posts' ) ).toBe( ReportPage );
		expect( loader ).toHaveBeenCalledTimes( 1 );
	} );
} );
