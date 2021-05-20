<?php
/**
 * WP-Admin Posts list bootstrap file.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Posts_List_Page_Notification;

require_once __DIR__ . '/class-posts-list-page-notification.php';

Posts_List_Page_Notification::init();
