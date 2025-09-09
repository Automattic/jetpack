<?php
/**
 * Test AbilityRegistry class
 *
 * @package automattic/jetpack-mcp
 */

namespace Automattic\Jetpack\Tests;

use Automattic\Jetpack\AbilitiesRegistry\Registry\AbilityRegistry;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test AbilityRegistry functionality.
 */
class Ability_Registry_Test extends TestCase {

	/**
	 * Test getting all ability names.
	 */
	public function test_get_all_names() {
		$names = AbilityRegistry::get_all_names();

		$this->assertIsArray( $names );
		$this->assertNotEmpty( $names );
		$this->assertContains( 'wpcom-mcp/user-sites', $names );
		$this->assertContains( 'wpcom-mcp/posts-search', $names );
	}

	/**
	 * Test getting abilities by type.
	 */
	public function test_get_abilities_by_type() {
		$tools     = AbilityRegistry::get_abilities_by_type( 'tool' );
		$resources = AbilityRegistry::get_abilities_by_type( 'resource' );
		$prompts   = AbilityRegistry::get_abilities_by_type( 'prompt' );

		$this->assertIsArray( $tools );
		$this->assertIsArray( $resources );
		$this->assertIsArray( $prompts );

		// Check that we have some tools
		$this->assertNotEmpty( $tools );

		// Verify all returned abilities are of the correct type
		foreach ( $tools as $metadata ) {
			$this->assertEquals( 'tool', $metadata['type'] );
		}
	}

	/**
	 * Test getting abilities by server.
	 */
	public function test_get_abilities_by_server() {
		$default_abilities    = AbilityRegistry::get_abilities_by_server( 'default' );
		$site_level_abilities = AbilityRegistry::get_abilities_by_server( 'site-level' );

		$this->assertIsArray( $default_abilities );
		$this->assertIsArray( $site_level_abilities );

		// Verify all returned abilities include the server
		foreach ( $default_abilities as $metadata ) {
			$this->assertContains( 'default', $metadata['servers'] );
		}
	}

	/**
	 * Test getting names for server.
	 */
	public function test_get_names_for_server() {
		$names = AbilityRegistry::get_names_for_server( 'default' );

		$this->assertIsArray( $names );
		$this->assertNotEmpty( $names );
		$this->assertContains( 'wpcom-mcp/user-sites', $names );
	}

	/**
	 * Test getting tools for server.
	 */
	public function test_get_tools_for_server() {
		$tools = AbilityRegistry::get_tools_for_server( 'default' );

		$this->assertIsArray( $tools );
		$this->assertNotEmpty( $tools );

		// Verify all returned tools are actually tools
		foreach ( $tools as $tool_name ) {
			$metadata = AbilityRegistry::get_metadata( $tool_name );
			$this->assertNotNull( $metadata, "Metadata should not be null for tool: $tool_name" );
			$this->assertEquals( 'tool', $metadata['type'] );
			$this->assertContains( 'default', $metadata['servers'] );
		}
	}

	/**
	 * Test getting resources for server.
	 */
	public function test_get_resources_for_server() {
		$resources = AbilityRegistry::get_resources_for_server( 'default' );

		$this->assertIsArray( $resources );

		// Verify all returned resources are actually resources
		foreach ( $resources as $resource_name ) {
			$metadata = AbilityRegistry::get_metadata( $resource_name );
			$this->assertNotNull( $metadata, "Metadata should not be null for resource: $resource_name" );
			$this->assertEquals( 'resource', $metadata['type'] );
			$this->assertContains( 'default', $metadata['servers'] );
		}
	}

	/**
	 * Test getting prompts for server.
	 */
	public function test_get_prompts_for_server() {
		$prompts = AbilityRegistry::get_prompts_for_server( 'default' );

		$this->assertIsArray( $prompts );

		// Verify all returned prompts are actually prompts
		foreach ( $prompts as $prompt_name ) {
			$metadata = AbilityRegistry::get_metadata( $prompt_name );
			$this->assertNotNull( $metadata, "Metadata should not be null for prompt: $prompt_name" );
			$this->assertEquals( 'prompt', $metadata['type'] );
			$this->assertContains( 'default', $metadata['servers'] );
		}
	}

	/**
	 * Test getting metadata for a specific ability.
	 */
	public function test_get_metadata() {
		$metadata = AbilityRegistry::get_metadata( 'wpcom-mcp/user-sites' );

		$this->assertIsArray( $metadata );
		$this->assertArrayHasKey( 'title', $metadata );
		$this->assertArrayHasKey( 'class', $metadata );
		$this->assertArrayHasKey( 'executor', $metadata );
		$this->assertArrayHasKey( 'category', $metadata );
		$this->assertArrayHasKey( 'type', $metadata );
		$this->assertArrayHasKey( 'servers', $metadata );
		$this->assertArrayHasKey( 'enabled', $metadata );
		$this->assertArrayHasKey( 'description', $metadata );

		$this->assertEquals( 'tool', $metadata['type'] );
		$this->assertContains( 'default', $metadata['servers'] );
	}

	/**
	 * Test getting metadata for non-existent ability.
	 */
	public function test_get_metadata_nonexistent() {
		$metadata = AbilityRegistry::get_metadata( 'nonexistent/ability' );

		$this->assertNull( $metadata );
	}

	/**
	 * Test getting executor class for ability.
	 */
	public function test_get_executor_class() {
		$executor_class = AbilityRegistry::get_executor_class( 'wpcom-mcp/user-sites' );

		$this->assertIsString( $executor_class );
		$this->assertStringContainsString( 'Executor', $executor_class );
	}

	/**
	 * Test getting ability class for ability name.
	 */
	public function test_get_ability_class() {
		$ability_class = AbilityRegistry::get_ability_class( 'wpcom-mcp/user-sites' );

		$this->assertIsString( $ability_class );
		$this->assertStringContainsString( 'Ability', $ability_class );
	}

	/**
	 * Test checking if ability exists.
	 */
	public function test_has_ability() {
		$this->assertTrue( AbilityRegistry::has_ability( 'wpcom-mcp/user-sites' ) );
		$this->assertFalse( AbilityRegistry::has_ability( 'nonexistent/ability' ) );
	}

	/**
	 * Test getting resource URI for ability.
	 */
	public function test_get_resource_uri() {
		$uri = AbilityRegistry::get_resource_uri( 'wpcom-mcp/user-sites' );

		$this->assertEquals( 'WordPress://wpcom-mcp/user-sites', $uri );
	}

	/**
	 * Test getting name for class.
	 */
	public function test_get_name_for_class() {
		$name = AbilityRegistry::get_name_for_class( 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserSitesAbility' );

		$this->assertEquals( 'wpcom-mcp/user-sites', $name );
	}

	/**
	 * Test getting name for non-existent class.
	 */
	public function test_get_name_for_nonexistent_class() {
		$name = AbilityRegistry::get_name_for_class( 'Nonexistent\\Class' );

		$this->assertNull( $name );
	}

	/**
	 * Test site-level server abilities.
	 */
	public function test_site_level_abilities() {
		$site_tools     = AbilityRegistry::get_tools_for_server( 'site-level' );
		$site_resources = AbilityRegistry::get_resources_for_server( 'site-level' );

		$this->assertIsArray( $site_tools );
		$this->assertIsArray( $site_resources );

		// Verify site-level abilities exist
		$all_site_abilities = array_merge( $site_tools, $site_resources );
		$this->assertNotEmpty( $all_site_abilities );
	}

	/**
	 * Test configuration loading and caching.
	 */
	public function test_config_caching() {
		// First call should load config
		$names1 = AbilityRegistry::get_all_names();

		// Second call should use cached config
		$names2 = AbilityRegistry::get_all_names();

		$this->assertEquals( $names1, $names2 );
		$this->assertNotEmpty( $names1 );
	}
}
