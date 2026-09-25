<?php
/**
 * Test fixture: stand-in for the generated widget manifest.
 *
 * Reached only through Analytics::widget_manifest_path(), proving ensure_widget_registry_ready()
 * still requires the manifest: drop that require and this file never loads, so the REST test fails.
 * Delegates the declaration so there's one stub accessor, not two.
 *
 * @package automattic/jetpack-premium-analytics
 */

require_once __DIR__ . '/../widget-modules-manifest.php';
