<?php

class WP_Test_Latex extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->setGlobals();

		require_once dirname( __FILE__ ) . '/../../../modules/latex.php';
	}

	/**
	 * @author popthestack
	 * @global array $themecolors
	 * @since 3.8.0
	 */
	private function setGlobals() {
		global $themecolors;

		if ( ! isset( $themecolors ) ) {
			$themecolors = array();
		}

		$themecolors['text'] = '';
		$themecolors['bg']   = '';
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::instance
	 * @since 3.8.0
	 */
	public function test_latex_instance() {
		$this->assertInstanceOf( 'Jetpack_Latex', Jetpack_Latex::instance() );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::instance
	 * @since 3.8.0
	 */
	public function test_latex_instance_singleton() {
		$latex = Jetpack_Latex::instance();

		$this->assertEquals( $latex, Jetpack_Latex::instance() );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_shortcode
	 * @since 3.8.0
	 */
	public function test_latex_shortocde_exists() {
		$this->assertEquals( true, shortcode_exists( 'latex' ) );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_no_texturize
	 * @since 3.8.0
	 */
	public function test_latex_no_texturize() {
		$this->assertEquals( array( 'latex' ), Jetpack_Latex::instance()->latex_no_texturize( array() ) );
	}

	public function test_latex_output_mathjax_script() {
		$latex = Jetpack_Latex::instance();

		ob_start();
		$result = $latex->output_mathjax_script();
		$script_tag = ob_get_clean();

		$this->assertContains( 'MathJax.js', $script_tag );
		$this->assertTrue( $result );

		// It should not output anything a second time.
		$this->assertFalse( $latex->output_mathjax_script() );
	}

	public function test_latex_mathjax_config_output() {
		$latex = Jetpack_Latex::instance();

		ob_start();
		$latex->latex_mathjax_config_output();
		$script_tag = ob_get_clean();

		$this->assertContains( 'MathJax.Hub.Config', $script_tag );
		$this->assertContains( 'text/x-mathjax-config', $script_tag );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::render
	 * @since 3.8.0
	 */
	public function test_latex_render() {
		$latex = Jetpack_Latex::instance();
		$math = '1 + 2';
		$this->assertEquals( '$latex ' . $math . '$', $latex->render( $math, '', '', 0 ) );
		$this->assertEquals( '<span style="display: inline-block;font-size: 12pt;">$latex 1 + 2$</span>', $latex->render( $math, '', '', 1 ) );
		$this->assertEquals( '<span style="display: inline-block;color: #000;background-color: #fff;">$latex ' . $math . '$</span>', $latex->render( $math, '000', 'fff', 0 ) );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_mathjax_config
	 * @since 3.8.0
	 */
	public function test_latex_mathjax_config() {
		$admin_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $admin_id );

		$config = Jetpack_Latex::instance()->latex_mathjax_config();
		$this->assertInternalType( 'array', $config );
		$this->assertArrayHasKey( 'config', $config );
		$this->assertArrayHasKey( 'jax', $config );
		$this->assertArrayHasKey( 'extensions', $config );
		$this->assertArrayHasKey( 'TeX', $config );
		$this->assertArrayHasKey( 'tex2jax', $config );

		$this->assertEquals( true, $config['TeX']['noErrors']['disabled'] );
		$this->assertEquals( true, $config['TeX']['noUndefined']['disabled'] );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_mathjax_config
	 * @since 3.8.0
	 */
	public function test_latex_mathjax_config_error_reporting() {
		$user_id = $this->factory->user->create( array(
			'role' => 'subscriber',
		) );
		wp_set_current_user( $user_id );

		$config = Jetpack_Latex::instance()->latex_mathjax_config();
		$this->assertArrayNotHasKey( 'noErrors', $config['TeX'] );
		$this->assertArrayNotHasKey( 'noUndefined', $config['TeX']);
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_size_pt
	 * @since 3.8.0
	 */
	public function test_latex_size_pt() {
		$latex = Jetpack_Latex::instance();
		$this->assertEquals( false, $latex->latex_size_pt( 0 ) );
		$this->assertEquals( false, $latex->latex_size_pt( -5 ) );
		$this->assertEquals( false, $latex->latex_size_pt( 6 ) );
		$this->assertEquals( '12pt', $latex->latex_size_pt( 1 ) );
		$this->assertEquals( '14.4pt', $latex->latex_size_pt( 2 ) );
		$this->assertEquals( '17.28pt', $latex->latex_size_pt( 3 ) );
		$this->assertEquals( '20.74pt', $latex->latex_size_pt( 4 ) );
		$this->assertEquals( '24.88pt', $latex->latex_size_pt( 5 ) );
		$this->assertEquals( '11pt', $latex->latex_size_pt( -1 ) );
		$this->assertEquals( '10pt', $latex->latex_size_pt( -2 ) );
		$this->assertEquals( '8pt', $latex->latex_size_pt( -3 ) );
		$this->assertEquals( '7pt', $latex->latex_size_pt( -4 ) );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::mathjax_text_mode_workarounds
	 * @since 3.8.0
	 */
	public function test_latex_mathjax_text_mode_workarounds() {
		$fg = '';
		$bg = '';
		$s  = 0;
		$latex = Jetpack_Latex::instance();
		$this->assertEquals( false, $latex->mathjax_text_mode_workarounds( '1 + 2', $fg, $bg, $s ) );
		$this->assertEquals( false, $latex->mathjax_text_mode_workarounds( '4', $fg, $bg, $s ) );
		$this->assertEquals( '$latex \mathrm{\LaTeX}$', $latex->mathjax_text_mode_workarounds( '\LaTeX', $fg, $bg, $s ) );
		$this->assertEquals( '$latex \mathrm{\TeX}$', $latex->mathjax_text_mode_workarounds( '\TeX', $fg, $bg, $s ) );
		// Purposefully not testing \AmS, \AmS-\TeX, and \AmS-\LaTeX because $latex->render_img makes an HTTP request.
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::entity_decode
	 * @since 3.8.0
	 */
	public function test_latex_entity_decode() {
		$entities = '$latex 1 &lt; 2 &#038; 23&amp;fg=ccc$';
		$decoded  = '$latex 1 < 2 & 23&fg=ccc$';
		$latex    = Jetpack_Latex::instance();
		$this->assertEquals( $decoded, $latex->entity_decode( $entities ) );
	}

	/**
	 * @author popthestack
	 * @global array $themecolors
	 * @covers Jetpack_Latex::get_default_color
	 * @since 3.8.0
	 */
	public function test_latex_get_default_color() {
		global $themecolors;

		$latex = Jetpack_Latex::instance();

		$themecolors['testcolor1'] = 'ccc';
		$this->assertEquals( 'ccc', $latex->get_default_color( 'testcolor1' ) );
		$this->assertEquals( 'f00', $latex->get_default_color( 'testcolor2', 'f00' ) );

		$this->assertEquals( '', $latex->get_default_color( 'text' ) );
		$this->assertEquals( '', $latex->get_default_color( 'bg' ) );
		$this->assertEquals( '', $latex->get_default_color( 'text', '000' ) );
		$this->assertEquals( '', $latex->get_default_color( 'bg', 'fff' ) );
	}

	/**
	 * @author popthestack
	 * @global array $themecolors
	 * @covers Jetpack_Latex::latex_src
	 * @since 3.8.0
	 */
	public function test_latex_src() {
		global $themecolors;

		$latex = Jetpack_Latex::instance();

		$matches  = array( '', 'e^{\i \pi} + 1 = 0' );
		$rendered = '$latex e^{\i \pi} + 1 = 0$';
		$this->assertEquals( $rendered, $latex->latex_src( $matches ) );

		$themecolors['text'] = 'f00';
		$themecolors['bg']   = '000';
		$this->assertEquals( '<span style="display: inline-block;color: #f00;background-color: #000;">' . $rendered . '</span>', $latex->latex_src( $matches ) );
	}

	/**
	 * @author popthestack
	 * @covers Jetpack_Latex::latex_markup
	 * @since 3.8.0
	 */
	public function test_latex_markup() {
		$markup   = '<p>Some math: $latex e^{\i \pi} + 1 = 0$.</p><p>Some more math:<br />$latex f(x) & = Sin(\pi)x - Sin(\pi^2)x + Cos(-\pi^3)*x$</p>';
		$rendered = '<p>Some math: $latex e^{\i \pi} + 1 = 0$.</p><p>Some more math:<br />$latex f(x) & = Sin(\pi)x - Sin(\pi^2)x + Cos(-\pi^3)*x$</p>';
		$this->assertEquals( $rendered, Jetpack_Latex::instance()->latex_markup( $markup ) );
	}

} // end class
