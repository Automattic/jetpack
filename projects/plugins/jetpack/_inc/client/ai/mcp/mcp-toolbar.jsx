/**
 * Page-level toolbar shared by the MCP Read and Write views.
 */

import { __ } from '@wordpress/i18n';
import { Card, Stack, SwitchControl, Text } from '@wordpress/ui';

/**
 * Intro text and a page-wide "Enable all" toggle.
 *
 * @param {object}   props             - Component props.
 * @param {boolean}  props.allEnabled  - Whether every tool on the page is on.
 * @param {boolean}  props.isDisabled  - Disables the toggle.
 * @param {Function} props.onEnableAll - Called with the new enabled state.
 * @param {object}   [props.children]  - Extra controls below the toggle, e.g. search.
 * @return {object} Component markup.
 */
export default function McpToolbar( { allEnabled, isDisabled, onEnableAll, children } ) {
	return (
		<div className="jetpack-ai-mcp__toolbar">
			<Card.Root>
				<Card.Content className="jetpack-ai-mcp__card-content">
					<Stack direction="column" gap="md">
						<Text render={ <p /> } className="jetpack-ai-mcp__muted">
							{ __( 'Turn individual tools on or off. Changes save automatically.', 'jetpack' ) }
						</Text>
						<SwitchControl
							checked={ allEnabled }
							disabled={ isDisabled }
							label={ __( 'Enable all', 'jetpack' ) }
							onCheckedChange={ onEnableAll }
						/>
						{ children }
					</Stack>
				</Card.Content>
			</Card.Root>
		</div>
	);
}
