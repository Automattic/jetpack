<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_GoogleApps extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	public function test_presentation_variation_1() {
		$embed     = '<iframe src="https://docs.google.com/present/embed?id=dhfhrphh_123drp8s65c&interval=15&autoStart=true&loop=true&size=l" frameborder="0" width="700" height="559"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="present/embed" query="id=dhfhrphh_123drp8s65c&amp;interval=15&amp;autoStart=true&amp;loop=true&amp;size=l" width="700" height="559" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_presentation_variation_2() {
		$embed     = '<iframe src="https://docs.google.com/presentation/embed?id=13ItX4jV0SOSdr-ZjHarcpTh9Lr4omfsHAp87jpxv8-0&start=false&loop=false&delayms=3000" frameborder="0" width="960" height="749" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="presentation/embed" query="id=13ItX4jV0SOSdr-ZjHarcpTh9Lr4omfsHAp87jpxv8-0&amp;start=false&amp;loop=false&amp;delayms=3000" width="960" height="749" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_presentation_variation_3() {
		$embed     = '<iframe src="https://docs.google.com/presentation/d/1eXExVGHF1G_8dqCshU1JNCxiScOkjDBn5Zux0NmYI_I/embed?start=false&loop=false&delayms=60000" height="389" width="480" allowfullscreen="true" frameborder="0"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="presentation/d/1eXExVGHF1G_8dqCshU1JNCxiScOkjDBn5Zux0NmYI_I/embed" query="start=false&amp;loop=false&amp;delayms=60000" width="480" height="389" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_document_variation_1() {
		$embed     = '<iframe src="https://docs.google.com/document/pub?id=1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4&amp;embedded=true"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="document/pub" query="id=1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4&amp;embedded=true" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_document_variation_1_to_embed() {
		$embed           = '<iframe src="https://docs.google.com/document/pub?id=1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4&amp;embedded=true"></iframe>';
		$expected_output = '<iframe src="https://docs.google.com/document/pub?id=1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4&#038;embedded=true" frameborder="0" width="100%"';

		$shortcode = googleapps_embed_to_shortcode( $embed );
		add_shortcode( 'googleapps', 'googleapps_shortcode' );
		$to_embed = do_shortcode( $shortcode );

		$this->assertStringContainsString( $expected_output, $to_embed );
	}

	public function test_document_variation_2() {
		$embed     = '<iframe src="https://docs.google.com/document/d/1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4/pub?embedded=true"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="document/d/1kDatklacdZ_tZUOpWtt_ONzY97Ldj2zFcuO9LBY2Ln4/pub" query="embedded=true" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_document_variation_3() {
		$embed     = '<iframe src="https://docs.google.com/document/d/1bEar7sbWCO86DAXa93OsbX0wxTLA4J7FNM6-YeRz-pw/pub?embedded=true"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="document/d/1bEar7sbWCO86DAXa93OsbX0wxTLA4J7FNM6-YeRz-pw/pub" query="embedded=true" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_document_variation_4() {
		$embed     = '<iframe src="https://docs.google.com/document/d/e/2PACX-1vRkpIdasKL-eKXDjJgpEONduUspZTz0YmKaajfie0eJYnzikuyusuG1_V8X8T9XflN9l8A1oCM2sgEA/pub?embedded=true"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="document/d/e/2PACX-1vRkpIdasKL-eKXDjJgpEONduUspZTz0YmKaajfie0eJYnzikuyusuG1_V8X8T9XflN9l8A1oCM2sgEA/pub" query="embedded=true" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_document_variation_2_to_embed() {
		$embed           = '<iframe src="https://docs.google.com/document/d/1wy2kzRYYSQV0ZHe58DOvQwRQ8syrY5AhgUnKkKXk9N8/pub?embedded=true"></iframe>';
		$expected_output = '<iframe src="https://docs.google.com/document/d/1wy2kzRYYSQV0ZHe58DOvQwRQ8syrY5AhgUnKkKXk9N8/pub?embedded=true" frameborder="0" width="100%"';

		$shortcode = googleapps_embed_to_shortcode( $embed );
		add_shortcode( 'googleapps', 'googleapps_shortcode' );
		$to_embed = do_shortcode( $shortcode );

		$this->assertStringContainsString( $expected_output, $to_embed );
	}

	public function test_external_document() {
		$embed     = '<iframe width=100% height=560px frameborder=0 src=https://docs.google.com/a/pranab.in/viewer?a=v&pid=explorer&chrome=false&embedded=true&srcid=1VTMwdgGiDMt8MCr75-YkQP-4u9WmEp1Qvf6C26KYBgFilxU2qndpd-VHhBIn&hl=en></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="viewer" query="a=v&amp;pid=explorer&amp;chrome=false&amp;embedded=true&amp;srcid=1VTMwdgGiDMt8MCr75-YkQP-4u9WmEp1Qvf6C26KYBgFilxU2qndpd-VHhBIn&amp;hl=en" width="100%" height="560" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_legacy_form() {
		$embed     = '<iframe src="https://spreadsheets.google.com/embeddedform?formkey=dEVOYnMzZG5jMUpGbjFMYjFYNVB3NkE6MQ" width="760" height="710" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="spreadsheets" dir="embeddedform" query="formkey=dEVOYnMzZG5jMUpGbjFMYjFYNVB3NkE6MQ" width="760" height="710" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_form() {
		$embed     = '<iframe src="https://docs.google.com/forms/d/1Gy5FxtP_FwbvvLk6lxC-pO0wkIh2J9HwTcCS5f27iG8/viewform?embedded=true" width="760" height="500" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="forms/d/1Gy5FxtP_FwbvvLk6lxC-pO0wkIh2J9HwTcCS5f27iG8/viewform" query="embedded=true" width="760" height="500" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_widget_variation_1() {
		$embed     = "<iframe width='500' height='300' frameborder='0' src='https://spreadsheets1.google.com/a/petedavies.com/pub?hl=en&hl=en&key=0AjSij7nlnXvKdHNsNjRSWG12YmVfOEFwdlMxQ3J1S1E&single=true&gid=0&output=html&widget=true'></iframe>";
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="spreadsheets" dir="a/petedavies.com/pub" query="hl=en&amp;hl=en&amp;key=0AjSij7nlnXvKdHNsNjRSWG12YmVfOEFwdlMxQ3J1S1E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500" height="300" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_widget_variation_2() {
		$embed     = "<iframe width='500' height='300' frameborder='0' src='https://spreadsheets.google.com/spreadsheet/pub?hl=en&hl=en&key=0AhInIwfvYrIUdGJiTXhtUEhBSFVPUzdRZU5OMDlqdnc&output=html&widget=true'></iframe>";
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="spreadsheets" dir="spreadsheet/pub" query="hl=en&amp;hl=en&amp;key=0AhInIwfvYrIUdGJiTXhtUEhBSFVPUzdRZU5OMDlqdnc&amp;output=html&amp;widget=true" width="500" height="300" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_widget_variation_3() {
		$embed     = '<iframe src="https://docs.google.com/spreadsheets/d/1rKeXLwDYBmVuD1XYZFu2Id-9Xs1a1YHuPhZA-01tBPg/pubhtml?widget=true&amp;headers=false"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="spreadsheets/d/1rKeXLwDYBmVuD1XYZFu2Id-9Xs1a1YHuPhZA-01tBPg/pubhtml" query="widget=true&amp;headers=false" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_spreadsheet_widget_variation_4() {
		$embed     = '<iframe src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQOnHvMNvmHbXUCDAyzUedmA8UWctJqSkUwS8cC7KHF1XASTzRdVYu09tYvDl5xAPwCsaNRNODADmzm/pubhtml?widget=true&amp;headers=false"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="spreadsheets/d/e/2PACX-1vQOnHvMNvmHbXUCDAyzUedmA8UWctJqSkUwS8cC7KHF1XASTzRdVYu09tYvDl5xAPwCsaNRNODADmzm/pubhtml" query="widget=true&amp;headers=false" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_calendar_variation_1() {
		$embed     = '<iframe src="https://www.google.com/calendar/embed?src=serjant%40gmail.com&ctz=Europe/Sofia" style="border: 0;" width="800" height="600" frameborder="0" scrolling="no"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="www" dir="calendar/embed" query="src=serjant%40gmail.com&amp;ctz=Europe/Sofia" width="800" height="600" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_calendar_variation_2() {
		$embed     = '<iframe src="http://www.google.com/calendar/hosted/belcastro.com/embed?src=n8nr8sd6v9hnus3nmlk7ed1238%40group.calendar.google.com&ctz=Europe/Zurich" style="border: 0;" width="800" height="600" frameborder="0" scrolling="no"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="www" dir="calendar/hosted/belcastro.com/embed" query="src=n8nr8sd6v9hnus3nmlk7ed1238%40group.calendar.google.com&amp;ctz=Europe/Zurich" width="800" height="600" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_calendar_variation_3() {
		$embed     = '<iframe src="https://calendar.google.com/calendar/embed?src=jb4bu80jirp0u11a6niie21pp4%40group.calendar.google.com&ctz=America/New_York" style="border: 0;" width="800" height="600" frameborder="0" scrolling="no"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="calendar" dir="calendar/embed" query="src=jb4bu80jirp0u11a6niie21pp4%40group.calendar.google.com&amp;ctz=America/New_York" width="800" height="600" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_customized_calendar() {
		$embed     = '<iframe src="https://www.google.com/calendar/embed?title=asdf&amp;showTitle=0&amp;showNav=0&amp;showDate=0&amp;showPrint=0&amp;showTabs=0&amp;showCalendars=0&amp;showTz=0&amp;mode=AGENDA&amp;height=300&amp;wkst=2&amp;hl=fi&amp;bgcolor=%23ffcccc&amp;src=m52gdmbgelo3itf00u1v44g0ns%40group.calendar.google.com&amp;color=%234E5D6C&amp;src=serjant%40gmail.com&amp;color=%235229A3&amp;ctz=Europe%2FRiga" style="border: solid 1px #777;" width="500" height="300" frameborder="0" scrolling="no"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="www" dir="calendar/embed" query="title=asdf&amp;showTitle=0&amp;showNav=0&amp;showDate=0&amp;showPrint=0&amp;showTabs=0&amp;showCalendars=0&amp;showTz=0&amp;mode=AGENDA&amp;height=300&amp;wkst=2&amp;hl=fi&amp;bgcolor=%23ffcccc&amp;src=m52gdmbgelo3itf00u1v44g0ns%40group.calendar.google.com&amp;color=%234E5D6C&amp;src=serjant%40gmail.com&amp;color=%235229A3&amp;ctz=Europe%2FRiga" width="500" height="300" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_generic_embed_variation_1() {
		$embed     = '<iframe src="https://docs.google.com/file/d/0B0SIdZW7iu-zX1RWREJpMXVHZVU/preview" width="640" height="480"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="docs" dir="file/d/0B0SIdZW7iu-zX1RWREJpMXVHZVU/preview" query="" width="640" height="480" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_generic_embed_variation_2() {
		$embed     = '<iframe src="https://drive.google.com/file/d/0B0SIdZW7iu-zX1RWREJpMXVHZVU/preview" width="640" height="480"></iframe>';
		$shortcode = googleapps_embed_to_shortcode( $embed );

		$expected_shortcode = '[googleapps domain="drive" dir="file/d/0B0SIdZW7iu-zX1RWREJpMXVHZVU/preview" query="" width="640" height="480" /]';

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	public function test_embed_can_fullscreen() {
		$embed           = '<iframe src="https://docs.google.com/document/d/1wy2kzRYYSQV0ZHe58DOvQwRQ8syrY5AhgUnKkKXk9N8/pub?embedded=true"></iframe>';
		$expected_output = 'allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"';

		$shortcode = googleapps_embed_to_shortcode( $embed );
		add_shortcode( 'googleapps', 'googleapps_shortcode' );
		$to_embed = do_shortcode( $shortcode );

		$this->assertStringContainsString( $expected_output, $to_embed );
	}

}
