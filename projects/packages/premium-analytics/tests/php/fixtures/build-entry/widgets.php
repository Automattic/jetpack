<?php
/**
 * Test fixture: stand-in for the generated widget manifest.
 *
 * Reached only through widgets_manifest_path(), so a test can prove
 * ensure_widget_registry_ready() still requires the manifest: drop that require
 * and this file never loads, the registry stays empty, and the REST test fails.
 * Delegates the declaration so there is one stub accessor, not two.
 *
 * @package automattic/jetpack-premium-analytics
 */

require_once __DIR__ . '/../widget-modules-manifest.php';
