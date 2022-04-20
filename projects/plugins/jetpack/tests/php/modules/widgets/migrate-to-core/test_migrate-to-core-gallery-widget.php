<?php

require __DIR__ . '/../../../../../modules/widgets/migrate-to-core/gallery-widget.php';

class WP_Test_Jetpack_Migrate_Gallery_Widget extends WP_UnitTestCase {
	/**
	 * Test jetpack_migrate_gallery_widget_upgrade_widget when called with a non-array
	 */
	public function test_jetpack_migrate_gallery_widget_upgrade_widget_with_string() {
		$this->assertNull( jetpack_migrate_gallery_widget_upgrade_widget( 'string' ) );
	}

	/**
	 * Test jetpack_migrate_gallery_widget_upgrade_widget when called with an empty value
	 */
	public function test_jetpack_migrate_gallery_widget_upgrade_widget_with_empty() {
		$this->assertNull( jetpack_migrate_gallery_widget_upgrade_widget( array() ) );
	}

	/**
	 * Test jetpack_migrate_gallery_widget_upgrade_widget when called with valid widgets
	 */
	public function test_jetpack_migrate_gallery_widget_upgrade_widget_with_valid_widget() {
		$input   = array(
			'title' => 'Jetpack Gallery',
			'ids'   => '13,21,41,61,63,83',
			'link'  => 'carousel',
			'type'  => 'rectangular',
		);
		$input2  = array(
			'title'  => 'Jetpack Gallery',
			'ids'    => '13,21,41,61,63,83',
			'link'   => 'carousel',
			'type'   => 'rectangular',
			'random' => 'on',
		);
		$input3  = array(
			'title'      => 'Jetpack Gallery',
			'ids'        => '13,21,41,61,63,83',
			'link'       => 'carousel',
			'type'       => 'rectangular',
			'random'     => 'on',
			'conditions' => array(
				'action'    => 'show',
				'match_all' => '1',
				'rules'     => array(
					array(
						'major'        => 'author',
						'minor'        => '1',
						'has_children' => false,
					),
				),
			),
		);
		$output  = array(
			'columns'        => 3,
			'title'          => 'Jetpack Gallery',
			'ids'            => array(
				'13',
				'21',
				'41',
				'61',
				'63',
				'83',
			),
			'link_type'      => 'carousel',
			'orderby_random' => false,
			'size'           => 'thumbnail',
			'type'           => 'rectangular',
		);
		$output2 = array(
			'columns'        => 3,
			'title'          => 'Jetpack Gallery',
			'ids'            => array(
				'13',
				'21',
				'41',
				'61',
				'63',
				'83',
			),
			'link_type'      => 'carousel',
			'orderby_random' => true,
			'size'           => 'thumbnail',
			'type'           => 'rectangular',
		);
		$output3 = array(
			'columns'        => 3,
			'title'          => 'Jetpack Gallery',
			'ids'            => array(
				'13',
				'21',
				'41',
				'61',
				'63',
				'83',
			),
			'link_type'      => 'carousel',
			'orderby_random' => true,
			'size'           => 'thumbnail',
			'type'           => 'rectangular',
			'conditions'     => array(
				'action'    => 'show',
				'match_all' => '1',
				'rules'     => array(
					array(
						'major'        => 'author',
						'minor'        => '1',
						'has_children' => false,
					),
				),
			),
		);

		$this->assertEquals( $output, jetpack_migrate_gallery_widget_upgrade_widget( $input ) );
		$this->assertEquals( $output2, jetpack_migrate_gallery_widget_upgrade_widget( $input2 ) );
		$this->assertEquals( $output3, jetpack_migrate_gallery_widget_upgrade_widget( $input3 ) );
	}

	/**
	 * Test jetpack_migrate_gallery_widget_update_sidebars
	 */
	public function test_jetpack_migrate_gallery_widget_update_sidebars() {
		$input   = array(
			'wp_inactive_widgets' => array(),
			'sidebar-1'           => array(
				'gallery-1',
				'gallery-2',
			),
		);
		$output1 = array(
			'wp_inactive_widgets' => array(
				'gallery-1',
			),
			'sidebar-1'           => array(
				'media_gallery-1',
				'gallery-2',
			),
		);
		$output2 = array(
			'wp_inactive_widgets' => array(
				'gallery-1',
				'gallery-2',
			),
			'sidebar-1'           => array(
				'media_gallery-1',
				'media_gallery-2',
			),
		);
		$this->assertEquals( $output1, jetpack_migrate_gallery_widget_update_sidebars( $input, 1, 1 ) );
		$this->assertEquals( $output2, jetpack_migrate_gallery_widget_update_sidebars( $output1, 2, 2 ) );
	}
}
