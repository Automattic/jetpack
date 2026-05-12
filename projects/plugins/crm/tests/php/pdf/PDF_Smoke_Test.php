<?php
namespace Automattic\Jetpack\CRM\PDF\Tests;

use Automattic\Jetpack\CRM\Tests\JPCRM_Base_TestCase;
use Dompdf\Dompdf;

/**
 * Make sure PDFs render.
 */
class PDF_Smoke_Test extends JPCRM_Base_TestCase {

	/**
	 * Make sure we can get a preconfigured Dompdf instance.
	 */
	public function test_pdf_engine_returns_dompdf_instance(): void {
		global $zbs;

		$dompdf = $zbs->pdf_engine();

		$this->assertInstanceOf( Dompdf::class, $dompdf );
	}

	/**
	 * Make sure PDF content is actually rendered.
	 */
	public function test_minimal_pdf_output(): void {
		$dompdf = new Dompdf();
		$dompdf->loadHtml( '<html><body>Test</body></html>', 'UTF-8' );
		$dompdf->render();
		$output = $dompdf->output();

		$this->assertStringStartsWith( '%PDF-', $output, 'Output should be a valid PDF' );
		$this->assertNotEmpty( $output );
	}
}
