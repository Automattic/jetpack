/**
 * "How it works" explainer shown at the top of the MCP and Connectors tab.
 */

import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, comment, connection } from '@wordpress/icons';
import { Card, Icon, Text } from '@wordpress/ui';

const STEPS = [
	{
		key: 'enable',
		icon: check,
		title: __( 'Enable MCP', 'jetpack' ),
		description: __(
			'Give your AI agent access to the site and control what it can read and write.',
			'jetpack'
		),
	},
	{
		key: 'connect',
		icon: connection,
		title: __( 'Connect agent', 'jetpack' ),
		description: __(
			'Connect your agent of choice: Claude, ChatGPT, VS Code, and others.',
			'jetpack'
		),
	},
	{
		key: 'manage',
		icon: comment,
		title: __( 'Manage via chat', 'jetpack' ),
		description: __(
			'Create content, get reports, and manage your site from the conversation.',
			'jetpack'
		),
	},
];

/**
 * Static three-column card explaining the enable → connect → manage flow.
 *
 * @return {object} Component markup.
 */
export default function McpHowItWorks() {
	const headingId = useId();

	return (
		<Card.Root render={ <section aria-labelledby={ headingId } /> }>
			<Card.Header>
				<Card.Title render={ <h2 id={ headingId } /> }>
					{ __( 'How it works', 'jetpack' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content className="jetpack-ai-mcp__how-it-works-steps">
				{ STEPS.map( ( { key, icon, title, description } ) => (
					<div key={ key } className="jetpack-ai-mcp__how-it-works-step">
						<Icon icon={ icon } className="jetpack-ai-mcp__how-it-works-icon" />
						<Text render={ <h3 /> } variant="heading-md">
							{ title }
						</Text>
						<Text
							render={ <p /> }
							variant="body-md"
							className="jetpack-ai-mcp__how-it-works-description"
						>
							{ description }
						</Text>
					</div>
				) ) }
			</Card.Content>
		</Card.Root>
	);
}
