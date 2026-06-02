/**
 * MarkdownPanel — a card that renders sanitized HTML content under a heading.
 *
 * The HTML content is already sanitized server-side (via Parsedown + wp_kses)
 * before being passed through the API, so dangerouslySetInnerHTML is safe here.
 *
 * @package
 */

import { Card, Stack, Text } from '@wordpress/ui';

type Props = {
	title: string;
	html: string;
};

/**
 * Renders a card containing a heading and server-sanitized HTML content.
 *
 * @param {Props} props - Component props.
 * @return The card element.
 */
const MarkdownPanel = ( { title, html }: Props ) => {
	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text variant="heading-sm" render={ <h2 /> }>
						{ title }
					</Text>
					{ /* HTML is sanitized server-side via Parsedown + wp_kses before API delivery */ }
					{ /* eslint-disable-next-line react/no-danger */ }
					<div dangerouslySetInnerHTML={ { __html: html } } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default MarkdownPanel;
