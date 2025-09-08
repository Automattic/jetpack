<?php
/**
 * WordPress MCP AbilitiesRegistry Configuration
 *
 * Single source of truth for all ability definitions.
 * This file eliminates the need to repeat ability names across multiple files.
 *
 * @package automattic/jetpack-mcp
 */

return array(
	// User AbilitiesRegistry
	'wpcom-mcp/user-profile'             => array(
		'title'       => __( 'User Profile', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserProfileAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserProfileExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Get comprehensive user profile information', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-sites'               => array(
		'title'       => __( 'User Sites', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserSitesAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserSitesExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'List and manage user sites with filtering and metrics', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-achievements'        => array(
		'title'       => __( 'User Achievements', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserAchievementsAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserAchievementsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Access user achievements and progress tracking', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-connections'         => array(
		'title'       => __( 'User Connections', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserConnectionsAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserConnectionsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Manage user social connections and integrations', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-notifications'       => array(
		'title'       => __( 'User Notifications', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserNotificationsAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserNotificationsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Access and filter user notifications', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-notifications-inbox' => array(
		'title'       => __( 'User Notifications Inbox', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserNotificationsInboxAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserNotificationsInboxExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Comprehensive notifications inbox management', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-security'            => array(
		'title'       => __( 'User Security', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserSecurityAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserSecurityExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Access user security settings and 2FA status', 'jetpack-mcp' ),
	),

	'wpcom-mcp/user-subscriptions'       => array(
		'title'       => __( 'User Subscriptions', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\User\\UserSubscriptionsAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\User\\UserSubscriptionsExecutor',
		'category'    => 'user',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Manage user subscriptions and billing information', 'jetpack-mcp' ),
	),

	// Content AbilitiesRegistry
	'wpcom-mcp/posts-search'             => array(
		'title'       => __( 'Posts Search', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\Post\\PostsSearchAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\Post\\PostsSearchExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Search posts across all user sites', 'jetpack-mcp' ),
	),

	'wpcom-mcp/site-posts-search'        => array(
		'title'       => __( 'Site Posts Search', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\Post\\SitePostsSearchAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\Post\\SitePostsSearchExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'site-level' ),
		'enabled'     => true,
		'description' => __( 'Search posts within a specific site', 'jetpack-mcp' ),
	),

	'wpcom-mcp/post-get'                 => array(
		'title'       => __( 'Post Get', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\Post\\PostGetAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\Post\\PostGetExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => true,
		'description' => __( 'Retrieve a single post by ID or URL from any WordPress.com site', 'jetpack-mcp' ),
	),

	'wpcom-mcp/site-post-get'            => array(
		'title'       => __( 'Site Post Get', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\Post\\SitePostGetAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\Post\\SitePostGetExecutor',
		'category'    => 'content',
		'type'        => 'tool',
		'servers'     => array( 'site-level' ),
		'enabled'     => true,
		'description' => __( 'Retrieve a single post by ID or URL within the current site', 'jetpack-mcp' ),
	),

	// Analytics AbilitiesRegistry
	'wpcom-mcp/site-statistics'          => array(
		'title'       => __( 'Site Statistics', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\Analytics\\SiteStatisticsAbility',
		'executor'    => 'Automattic\\Jetpack\\AbilitiesRegistry\\Executors\\Analytics\\SiteStatisticsExecutor',
		'category'    => 'analytics',
		'type'        => 'tool',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Get comprehensive site statistics including views, visitors, top content, referrers, and performance metrics', 'jetpack-mcp' ),
	),

	// Resource AbilitiesRegistry
	'wpcom-mcp/user-sites-resource'      => array(
		'title'       => __( 'Site Resources', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\ExampleUserSitesResourceAbility',
		'executor'    => null, // Resources don't need executors
		'category'    => 'user',
		'type'        => 'resource',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Resource representation of user sites data', 'jetpack-mcp' ),
	),

	// Prompt AbilitiesRegistry
	'wpcom-mcp/sample-prompt'            => array(
		'title'       => __( 'Sample Prompt', 'jetpack-mcp' ),
		'class'       => 'Automattic\\Jetpack\\AbilitiesRegistry\\Abilities\\ExamplePromptAbility',
		'executor'    => null, // Prompts don't need executors
		'category'    => 'utility',
		'type'        => 'prompt',
		'servers'     => array( 'default' ),
		'enabled'     => false,
		'description' => __( 'Sample prompt for testing and examples', 'jetpack-mcp' ),
	),
);
