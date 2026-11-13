/**
 * The Send to agent menu: hand a skill's prompt to the WordPress Agent,
 * Claude, ChatGPT, or the clipboard.
 */

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, copy, external, wordpress } from '@wordpress/icons';
import { Button, Icon, Menu, VisuallyHidden } from '@wordpress/ui';
import { chatGptIcon, claudeIcon } from '../overview/connector-icons';

// Agents reached through a new tab with the prompt in the URL. Both read `q`
// as the first message, which the user still sends themselves.
export const EXTERNAL_AGENTS = {
	claude: {
		name: 'Claude', // Product name, not translated.
		icon: claudeIcon,
		url: prompt => 'https://claude.ai/new?q=' + encodeURIComponent( prompt ),
	},
	chatgpt: {
		name: 'ChatGPT', // Product name, not translated.
		icon: chatGptIcon,
		url: prompt => 'https://chatgpt.com/?q=' + encodeURIComponent( prompt ),
	},
};

// The connector marks are inset in a 32-unit box, so they need the larger
// size to read at the weight of the WordPress icons beside them.
const PREFIX_ICON_SIZE = 20;

/**
 * One menu entry, bound to its agent.
 *
 * @param {object}   props                 - Component props.
 * @param {string}   props.agent           - Agent key passed to onSend.
 * @param {object}   props.icon            - Prefix icon.
 * @param {string}   props.label           - Item label.
 * @param {object}   [props.suffix]        - Content after the label.
 * @param {boolean}  [props.opensInNewTab] - Whether the agent opens in a new tab.
 * @param {Function} props.onSend          - Called with the agent key.
 * @return {object} Component markup.
 */
function AgentItem( { agent, icon, label, suffix, opensInNewTab = false, onSend } ) {
	const handleClick = useCallback( () => onSend( agent ), [ agent, onSend ] );
	return (
		<Menu.Item
			onClick={ handleClick }
			prefix={ <Menu.PrefixIcon icon={ icon } size={ PREFIX_ICON_SIZE } /> }
			suffix={ suffix }
		>
			{ /* The item is named by its label alone, so the new tab is said in
			     there, hidden, as Link's openInNewTab says it. */ }
			<Menu.ItemLabel>
				{ label }
				{ opensInNewTab && (
					<>
						{ ' ' }
						<VisuallyHidden>{ __( '(opens in a new tab)', 'jetpack' ) }</VisuallyHidden>
					</>
				) }
			</Menu.ItemLabel>
		</Menu.Item>
	);
}

/**
 * Send to agent menu.
 *
 * @param {object}   props                    - Component props.
 * @param {Function} props.onSend             - Called with the agent key: 'wordpress' |
 *                                            'claude' | 'chatgpt' | 'copy'.
 * @param {boolean}  props.showWordPressAgent - Whether to offer the WordPress Agent.
 * @param {string}   [props.variant]          - Trigger button variant.
 * @param {string}   [props.size]             - Trigger button size.
 * @param {string}   [props.className]        - Extra class for the trigger.
 * @param {string}   [props.label]            - Accessible name for the trigger, naming the skill.
 * @return {object} Component markup.
 */
export default function SendToAgentMenu( {
	onSend,
	showWordPressAgent,
	variant = 'outline',
	size = 'compact',
	className,
	label,
} ) {
	// Claude and ChatGPT open in a new tab, which the icon says on screen and
	// each item's label says to assistive tech.
	const externalSuffix = (
		<span className="jetpack-ai-discover__agent-menu-suffix">
			<Icon icon={ external } size={ 16 } />
		</span>
	);

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						variant={ variant }
						tone={ variant === 'solid' ? 'brand' : 'neutral' }
						size={ size }
						className={ className }
						aria-label={ label }
					/>
				}
			>
				{ __( 'Send to agent', 'jetpack' ) }
				<Icon icon={ chevronDown } size={ 18 } />
			</Menu.Trigger>
			<Menu.Popup>
				{ showWordPressAgent && (
					<AgentItem
						agent="wordpress"
						icon={ wordpress }
						label={ __( 'Ask WordPress Agent', 'jetpack' ) }
						onSend={ onSend }
					/>
				) }
				<AgentItem
					agent="claude"
					icon={ EXTERNAL_AGENTS.claude.icon }
					label={ __( 'Open in Claude', 'jetpack' ) }
					suffix={ externalSuffix }
					opensInNewTab
					onSend={ onSend }
				/>
				<AgentItem
					agent="chatgpt"
					icon={ EXTERNAL_AGENTS.chatgpt.icon }
					label={ __( 'Open in ChatGPT', 'jetpack' ) }
					suffix={ externalSuffix }
					opensInNewTab
					onSend={ onSend }
				/>
				<Menu.Separator />
				<AgentItem
					agent="copy"
					icon={ copy }
					label={ __( 'Copy for another agent', 'jetpack' ) }
					onSend={ onSend }
				/>
			</Menu.Popup>
		</Menu.Root>
	);
}
