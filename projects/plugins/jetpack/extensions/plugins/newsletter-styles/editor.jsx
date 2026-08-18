/*
 * Proof of concept for NL-839: the newsletter email design screen.
 *
 * Nothing here registers a block editor plugin. The email editor is its own
 * application on its own admin screen, so this entry point only has to hand
 * control to the mount, which no-ops everywhere else in wp-admin.
 */
import './newsletter-email-editor';
