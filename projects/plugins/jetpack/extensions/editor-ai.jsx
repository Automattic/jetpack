/**
 * Setup for the editor-ai bundles: the AI extensions split out of the main
 * editor bundle so the AI gate can stop them loading at all.
 *
 * Deliberately minimal. The shared editor setup (block category, slot fills,
 * data stores, beta labeling) lives in the main bundle only — this bundle
 * declares `jetpack-blocks-editor` as a script dependency, so those module-
 * scope registrations have already run. Duplicating them here would register
 * the JetpackPluginSidebar slot and the shared data stores twice.
 */
import './shared/public-path';
// The core Site Logo block's AI extension: it lives outside the AI extension
// directories but pulls in the AI client, so it belongs to this bundle.
import './extended-blocks/core-site-logo/index.tsx';
