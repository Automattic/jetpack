<?php
/**
 * Admin Menu Registration
 *
 * @package automattic/jetpack-admin-ui
 */

declare(strict_types=1);

namespace Automattic\Jetpack\Admin_UI;

/**
 * This class offers a wrapper to add_submenu_page and makes sure stand-alone
 * plugin's menu items are always added under the Jetpack top level menu.
 * If the Jetpack top level was not previously registered by another plugin,
 * it will be registered here.
 */
class Admin_Menu {

    /**
     * Package version.
     */
    public const PACKAGE_VERSION = '0.5.12';

    /**
     * Whether this class has been initialized.
     *
     * @var bool
     */
    private static bool $initialized = false;

    /**
     * List of menu items enqueued to be added.
     *
     * @var array<int, array<string, mixed>>
     */
    private static array $menu_items = [];

    /**
     * Initialize the class and set up the main hook.
     *
     * @return void
     */
    public static function init(): void {
        if ( self::$initialized || ! is_admin() ) {
            return;
        }

        self::$initialized = true;
        self::handle_akismet_menu();

        // Priority ensures Jetpack menu exists before adding submenus.
        add_action( 'admin_menu', [ __CLASS__, 'admin_menu_hook_callback' ], 1000 );
        add_action( 'network_admin_menu', [ __CLASS__, 'admin_menu_hook_callback' ], 1000 );
    }

    /**
     * Add a submenu item.
     *
     * @param string   $page_title Page title.
     * @param string   $menu_title Menu title.
     * @param string   $capability Required capability.
     * @param string   $menu_slug  Menu slug.
     * @param callable $callback   Callback function.
     *
     * @return void
     */
    public static function add_menu_item(
        string $page_title,
        string $menu_title,
        string $capability,
        string $menu_slug,
        callable $callback
    ): void {
        self::$menu_items[] = [
            'page_title' => $page_title,
            'menu_title' => $menu_title,
            'capability' => $capability,
            'menu_slug'  => $menu_slug,
            'callback'   => $callback,
        ];
    }

    /**
     * Hook callback for adding all stored menu items.
     *
     * @return void
     */
    public static function admin_menu_hook_callback(): void {
        if ( empty( self::$menu_items ) ) {
            return;
        }

        // Ensure Jetpack top-level menu exists.
        if ( ! menu_page_url( 'jetpack', false ) ) {
            add_menu_page(
                __( 'Jetpack', 'jetpack' ),
                __( 'Jetpack', 'jetpack' ),
                'manage_options',
                'jetpack',
                '__return_null',
                'dashicons-shield',
                3
            );
        }

        foreach ( self::$menu_items as $item ) {
            if ( ! isset( $item['page_title'], $item['menu_title'], $item['capability'], $item['menu_slug'], $item['callback'] ) ) {
                continue; // Skip invalid menu item definitions.
            }

            add_submenu_page(
                'jetpack',
                $item['page_title'],
                $item['menu_title'],
                $item['capability'],
                $item['menu_slug'],
                $item['callback']
            );
        }
    }

    /**
     * Handle Akismet menu placement under Jetpack.
     *
     * @return void
     */
    private static function handle_akismet_menu(): void {
        if ( ! function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if ( is_plugin_active( 'akismet/akismet.php' ) ) {
            add_action( 'admin_menu', static function (): void {
                global $submenu;

                if ( isset( $submenu['jetpack'] ) ) {
                    foreach ( $submenu['jetpack'] as $item ) {
                        if ( in_array( 'Akismet', $item, true ) ) {
                            return; // Already added.
                        }
                    }
                }

                add_submenu_page(
                    'jetpack',
                    __( 'Akismet Anti-Spam', 'jetpack' ),
                    __( 'Akismet', 'jetpack' ),
                    'manage_options',
                    'akismet-key-config',
                    '__return_null'
                );
            }, 999 );
        }
    }
}
