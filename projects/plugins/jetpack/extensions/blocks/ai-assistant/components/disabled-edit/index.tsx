/**
 * External dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Stands in for the AI Assistant block while Jetpack AI, or the Writing
 * Assistant, is switched off for the site. Renders an empty block, so a saved
 * block stays in the post without core's "unsupported block" warning and can
 * still be selected and removed from the list view.
 *
 * @return {JSX.Element} The empty block.
 */
export default function DisabledEdit() {
	return <div { ...useBlockProps() } />;
}
