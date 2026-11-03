import getJetpackAiManageUrl from '../get-jetpack-ai-manage-url';

const adminUrl = 'https://example.com/wp-admin/';
const hubUrl = `${ adminUrl }admin.php?page=jetpack-ai`;

describe( 'getJetpackAiManageUrl', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'the printed URL', hubUrl, hubUrl ],
		[
			"My Jetpack's AI page when none is printed",
			undefined,
			`${ adminUrl }admin.php?page=my-jetpack#/jetpack-ai`,
		],
	] )( 'returns %s', ( _, aiManageUrl, expected ) => {
		window.JetpackScriptData = { site: { admin_url: adminUrl }, myJetpack: { aiManageUrl } };

		expect( getJetpackAiManageUrl() ).toBe( expected );
	} );
} );
