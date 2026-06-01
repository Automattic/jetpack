/**
 * MarkdownPanel — a collapsible card that renders sanitized HTML content.
 *
 * The HTML content is already sanitized server-side (via Parsedown + wp_kses)
 * before being passed through the API, so dangerouslySetInnerHTML is safe here.
 *
 * @package
 */

import { CollapsibleCard } from '@wordpress/ui';

type Props = {
	title: string;
	html: string;
};

/**
 * Renders a collapsible card containing server-sanitized HTML content.
 *
 * @param {Props} props - Component props.
 * @return The collapsible card element.
 */
const MarkdownPanel = ( { title, html }: Props ) => {
	return (
		<CollapsibleCard.Root defaultOpen={ true }>
			<CollapsibleCard.Header>{ title }</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				{ /* HTML is sanitized server-side via Parsedown + wp_kses before API delivery */ }
				{ /* eslint-disable-next-line react/no-danger */ }
				<div dangerouslySetInnerHTML={ { __html: html } } />
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default MarkdownPanel;
