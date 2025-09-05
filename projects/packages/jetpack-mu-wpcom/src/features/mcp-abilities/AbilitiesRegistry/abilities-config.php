<?php
/**
 * WordPress MCP AbilitiesRegistry Configuration
 *
 * Single source of truth for all ability definitions.
 * This file eliminates the need to repeat ability names across multiple files.
 *
 * @package automattic/jetpack-mu-wpcom
 */

return array(
	// User AbilitiesRegistry
	'wpcom-mcp/user-profile'             => array(
		'title'       => __( 'User Profile', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserProfileAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserProfileExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Get comprehensive user profile information', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-sites'               => array(
		'title'       => __( 'User Sites', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserSitesAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserSitesExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'List and manage user sites with filtering and metrics', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-achievements'        => array(
		'title'       => __( 'User Achievements', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserAchievementsAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserAchievementsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Access user achievements and progress tracking', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-connections'         => array(
		'title'       => __( 'User Connections', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserConnectionsAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserConnectionsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Manage user social connections and integrations', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-notifications'       => array(
		'title'       => __( 'User Notifications', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserNotificationsAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserNotificationsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Access and filter user notifications', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-notifications-inbox' => array(
		'title'       => __( 'User Notifications Inbox', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserNotificationsInboxAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserNotificationsInboxExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Comprehensive notifications inbox management', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-security'            => array(
		'title'       => __( 'User Security', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserSecurityAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserSecurityExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Access user security settings and 2FA status', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/user-subscriptions'       => array(
		'title'       => __( 'User Subscriptions', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\User\\UserSubscriptionsAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\User\\UserSubscriptionsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Manage user subscriptions and billing information', 'jetpack-mu-wpcom' ),
	),

	// Content AbilitiesRegistry
	'wpcom-mcp/posts-search'             => array(
		'title'       => __( 'Posts Search', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Post\\PostsSearchAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Post\\PostsSearchExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Search posts across all user sites', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/site-posts-search'        => array(
		'title'       => __( 'Site Posts Search', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Post\\SitePostsSearchAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Post\\SitePostsSearchExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'site-level' ),
		'enabled'     => true,
		'description' => __( 'Search posts within a specific site', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/post-get'                 => array(
		'title'       => __( 'Post Get', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Post\\PostGetAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Post\\PostGetExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Retrieve a single post by ID or URL from any WordPress.com site', 'jetpack-mu-wpcom' ),
	),

	'wpcom-mcp/site-post-get'            => array(
		'title'       => __( 'Site Post Get', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Post\\SitePostGetAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Post\\SitePostGetExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'site-level' ),
		'enabled'     => true,
		'description' => __( 'Retrieve a single post by ID or URL within the current site', 'jetpack-mu-wpcom' ),
	),

	// Analytics AbilitiesRegistry
	'wpcom-mcp/site-statistics'          => array(
		'title'       => __( 'Site Statistics', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Analytics\\SiteStatisticsAbility',
		'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Analytics\\SiteStatisticsExecutor',
		'category'    => 'analytics',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Get comprehensive site statistics including views, visitors, top content, referrers, and performance metrics', 'jetpack-mu-wpcom' ),
	),

	// Resource AbilitiesRegistry
	'wpcom-mcp/user-sites-resource'      => array(
		'title'       => __( 'Site Resources', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\ExampleUserSitesResourceAbility',
		'executor'    => null, // Resources don't need executors
		'category'    => 'user',
		'type'        => 'resource',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Resource representation of user sites data', 'jetpack-mu-wpcom' ),
	),

	// Prompt AbilitiesRegistry
	'wpcom-mcp/sample-prompt'            => array(
		'title'       => __( 'Sample Prompt', 'jetpack-mu-wpcom' ),
		'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\ExamplePromptAbility',
		'executor'    => null, // Prompts don't need executors
		'category'    => 'utility',
		'type'        => 'prompt',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Sample prompt for testing and examples', 'jetpack-mu-wpcom' ),
	),
);
