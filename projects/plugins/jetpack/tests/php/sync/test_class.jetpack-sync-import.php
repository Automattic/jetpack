<?php

/**
 * Testing Import Syncing Events
 */
class WP_Test_Jetpack_Sync_Import extends WP_Test_Jetpack_Sync_Base {
	public function test_sync_export_content_event() {
		// Can't call export_wp directly since it require no headers to be set...
		do_action( 'export_wp', array( 'content' => 'all' ) );
		$this->sender->do_sync();
		$event = $this->server_event_storage->get_most_recent_event( 'export_wp' );
		$this->assertTrue( (bool) $event );
		$this->assertEquals( 'all', $event->args[0]['content'] );
	}

	public function test_import_start_action_syncs_jetpack_sync_import_start() {
		do_action( 'import_start', 'test-importer' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_start' );
		$this->assertEquals( 'test-importer', $event->args[0] );
		$this->assertEquals( 'Unknown Importer', $event->args[1] );
	}

	public function test_import_done_action_syncs_jetpack_sync_import_end() {
		do_action( 'import_done', 'test' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_end' );
		$this->assertEquals( 'test', $event->args[0] );
		$this->assertEquals( 'Unknown Importer', $event->args[1] );
	}

	public function test_import_end_action_syncs_jetpack_sync_import_end() {
		do_action( 'import_end' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_end' );
		$this->assertEquals( 'unknown', $event->args[0] );
		$this->assertEquals( 'Unknown Importer', $event->args[1] );
	}

	public function test_import_end_and_import_done_action_syncs_jetpack_sync_import_end() {
		do_action( 'import_end' );
		do_action( 'import_done', 'test' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_end' );
		$this->assertEquals( 'unknown', $event->args[0] );
	}

	public function test_import_done_and_import_end_action_syncs_jetpack_sync_import_end() {
		do_action( 'import_done', 'test' );
		do_action( 'import_end' );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_end' );
		$this->assertEquals( 'test', $event->args[0] );
	}

	public function test_import_sync_detects_known_importer_when_name_not_provided() {
		$rss_importer = new RSS_Import();
		$rss_importer->start_fake_rss_import();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_start' );
		$this->assertEquals( 'rss', $event->args[0] );
	}

	public function test_import_sync_sends_class_for_unknown_importer() {
		$unknown_importer = new Unknown_Import();
		$unknown_importer->start_fake_import();
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_import_start' );
		$this->assertEquals( 'Unknown_Import', $event->args[0] );
	}
}

// We try to detect importers based in extending `WP_Importer`. Mock that class, if needed.
// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
if ( ! class_exists( 'WP_Importer', false ) ) {
	class WP_Importer {}
}

// Mock known importer. Uses class name of a real importer plugin.
class RSS_Import extends WP_Importer {
	public function start_fake_rss_import() {
		do_action( 'import_start' );
	}
}

// Mock unknown importer.
class Unknown_Import extends WP_Importer {
	public function start_fake_import() {
		do_action( 'import_start' );
	}
}
// phpcs:enable Generic.Files.OneObjectStructurePerFile.MultipleFound
