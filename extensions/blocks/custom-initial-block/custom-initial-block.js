/**
 * WordPress dependencies
 */
import { Path, Rect, SVG } from '@wordpress/components';
import { PluginMoreMenuItem } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import useCustomInitialBlock from './use-custom-initial-block';

/**
 * @todo Replace with `@wordpress/icons` when available
 */
const html = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M4.8 11.4H2.1V9H1v6h1.1v-2.6h2.7V15h1.1V9H4.8v2.4zm1.9-1.3h1.7V15h1.1v-4.9h1.7V9H6.7v1.1zM16.2 9l-1.5 2.7L13.3 9h-.9l-.8 6h1.1l.5-4 1.5 2.8 1.5-2.8.5 4h1.1L17 9h-.8zm3.8 5V9h-1.1v6h3.6v-1H20z" />
	</SVG>
);
const markdown = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 128">
		<Rect
			width="198"
			height="118"
			x="5"
			y="5"
			ry="10"
			stroke="currentColor"
			strokeWidth="10"
			fill="none"
		/>
		<Path d="M30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zM155 98l-30-33h20v-35h20v35h20z" />
	</SVG>
);
export default function CustomInitialBlock() {
	const { setCustomInitialBlock } = useCustomInitialBlock();

	return (
		<>
			<PluginMoreMenuItem
				icon="editor-kitchensink"
				onClick={ setCustomInitialBlock( 'core/freeform' ) }
			>
				Use Classic block as default
			</PluginMoreMenuItem>
			<PluginMoreMenuItem icon={ markdown } onClick={ setCustomInitialBlock( 'jetpack/markdown' ) }>
				Use Markdown block as default
			</PluginMoreMenuItem>
			<PluginMoreMenuItem icon={ html } onClick={ setCustomInitialBlock( 'core/html' ) }>
				Use HTML block as default
			</PluginMoreMenuItem>
		</>
	);
}
