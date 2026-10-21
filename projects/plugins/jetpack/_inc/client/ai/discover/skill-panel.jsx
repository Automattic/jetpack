/**
 * A skill's side panel: what it needs, the prompt Send to agent hands over,
 * and the full instructions the agent follows. It opens from the right, beside
 * the catalog, in boot's route inspector, built like Send's email panel (and
 * Newsletter's subscriber panel before it): a bar with Close over a padded
 * body of section cards. Send to agent leads the body, under the skill's
 * title, as the panel's one primary action. Boot draws the surface and its
 * motion.
 *
 * Below boot's medium break the panel covers the hub, which goes inert behind
 * it (see main.jsx), so it says it's a modal dialog there and takes focus on
 * every open.
 */

import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close, copySmall } from '@wordpress/icons';
import { Button, Card, IconButton, Stack, Text } from '@wordpress/ui';
import { EVENTS, recordAiHubEvent } from '../tracks';
import SendToAgentMenu from './send-to-agent';
import { CategoryTile, FirstSkillBadge } from './skill-card';
import {
	PANEL_TITLE_ID,
	closeSkillPanel,
	getPanelSkill,
	takeOpenSource,
	useOpenSkillSlug,
} from './skill-panel-state';
import { APPLIES_LABELS, CATEGORY_LABELS, SECTION_TITLES, buildPrompt } from './skills';
import useCloseOnEscape from './use-close-on-escape';
import useSendSkill from './use-send-skill';
import { useIsWordPressAgentAvailable } from './wordpress-agent';

// Discover's own sheet first: the panel reuses its tile and muted text. It
// renders in boot's inspector, which may load without the Discover view.
import './style.scss';
import './skill-panel.scss';

/**
 * A card with a small heading, as on Send's and Newsletter's side panels.
 *
 * @param {object} props          - Component props.
 * @param {string} props.title    - The section's title.
 * @param {object} [props.action] - A control beside the title.
 * @param {object} props.children - The section.
 * @return {object} Component markup.
 */
function PanelSection( { title, action, children } ) {
	return (
		<Card.Root className="jetpack-ai-skill-panel__section">
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					{ /* Card.Title is a Text: the h3 and the small variant go on it
					     directly, rather than a second heading nested inside. */ }
					<Card.Title render={ <h3 /> } variant="heading-sm">
						{ title }
					</Card.Title>
					{ action }
				</Stack>
			</Card.Header>
			<Card.Content>{ children }</Card.Content>
		</Card.Root>
	);
}

/**
 * The panel's content.
 *
 * @param {object}   props                    - Component props.
 * @param {object}   props.skill              - The skill.
 * @param {string}   props.prompt             - The prompt Send to agent hands over.
 * @param {Function} props.onSend             - Called with the skill and the agent key.
 * @param {Function} props.onCopy             - Called with the skill, to copy its prompt.
 * @param {boolean}  props.showWordPressAgent - Whether to offer the WordPress Agent.
 * @param {Function} props.onClose            - Closes the panel.
 * @param {boolean}  [props.isModal]          - Whether the panel covers the hub, as a modal.
 * @return {object} Component markup.
 */
export function SkillPanel( {
	skill,
	prompt,
	onSend,
	onCopy,
	showWordPressAgent,
	onClose,
	isModal = false,
} ) {
	const handleSend = useCallback( agent => onSend( skill, agent ), [ skill, onSend ] );
	const handleCopy = useCallback( () => onCopy( skill ), [ skill, onCopy ] );

	useCloseOnEscape( onClose );

	return (
		<section
			className="jetpack-ai-skill-panel"
			aria-labelledby={ PANEL_TITLE_ID }
			role={ isModal ? 'dialog' : undefined }
			aria-modal={ isModal ? 'true' : undefined }
		>
			<Stack direction="column" gap="lg" className="jetpack-ai-skill-panel__body">
				<Stack direction="row" gap="sm" align="center" wrap="wrap">
					{ /* heading-xl, as Send's panel title. */ }
					<Text
						variant="heading-xl"
						className="jetpack-ai-skill-panel__title"
						render={ <h2 id={ PANEL_TITLE_ID } tabIndex={ -1 } /> }
					>
						{ skill.title }
					</Text>
					<FirstSkillBadge slug={ skill.slug } />
				</Stack>
				<Stack direction="row" gap="md" align="center">
					<CategoryTile category={ skill.category } />
					<Text render={ <p /> } variant="body-md" className="jetpack-ai-discover__muted">
						{ CATEGORY_LABELS[ skill.category ] } · { APPLIES_LABELS[ skill.applies ] }
					</Text>
				</Stack>
				{ /* The panel's main action, where the eye lands after the title.
				     A compact secondary button, as on the cards. */ }
				<SendToAgentMenu
					className="jetpack-ai-skill-panel__send"
					onSend={ handleSend }
					showWordPressAgent={ showWordPressAgent }
				/>
				<Text render={ <p /> } variant="body-sm" className="jetpack-ai-discover__muted">
					{ __(
						'Your agent asks for your OK before it starts, and again before each change.',
						'jetpack'
					) }
				</Text>

				<PanelSection title={ __( 'Prerequisites', 'jetpack' ) }>
					<Stack direction="column" gap="sm">
						<Text render={ <p /> } variant="body-md">
							{ skill.prereq }
						</Text>
						<Text render={ <p /> } variant="body-sm" className="jetpack-ai-discover__muted">
							{ __( 'Your agent checks these first and tells you what’s missing.', 'jetpack' ) }
						</Text>
					</Stack>
				</PanelSection>

				<PanelSection
					title={ __( 'Try it prompt', 'jetpack' ) }
					action={
						<Button
							variant="minimal"
							tone="neutral"
							size="small"
							className="jetpack-ai-skill-panel__copy"
							onClick={ handleCopy }
						>
							{ /* copySmall is the smallest copy glyph @wordpress/icons has;
							     at 14 it sits under the 13px label's cap height. */ }
							<Button.Icon icon={ copySmall } size={ 14 } />
							{ __( 'Copy', 'jetpack' ) }
						</Button>
					}
				>
					<Stack direction="column" gap="sm">
						<Text render={ <p /> } variant="body-md" className="jetpack-ai-skill-panel__prompt">
							{ prompt }
						</Text>
						<Text render={ <p /> } variant="body-sm" className="jetpack-ai-discover__muted">
							{ __(
								'This is what Send to agent pastes. The agent loads the full instructions itself.',
								'jetpack'
							) }
						</Text>
					</Stack>
				</PanelSection>

				<PanelSection title={ __( 'Instructions', 'jetpack' ) }>
					<div className="jetpack-ai-skill-panel__instructions">
						<Text render={ <p /> } variant="body-md">
							<strong>{ __( 'Goal:', 'jetpack' ) }</strong> { skill.goal }
						</Text>
						{ skill.sections.map( section => {
							const List = section.type === 'steps' ? 'ol' : 'ul';
							return (
								<section key={ section.type }>
									<Text render={ <h4 /> } variant="heading-md">
										{ SECTION_TITLES[ section.type ] }
									</Text>
									<List>
										{ section.items.map( item => (
											<Text key={ item } render={ <li /> } variant="body-md">
												{ item }
											</Text>
										) ) }
									</List>
								</section>
							);
						} ) }
					</div>
				</PanelSection>
			</Stack>
			{ /* The bar with Close comes last in the DOM and first on screen (the
			     stylesheet orders it): focus opens on the title, so Tab walks the
			     body and then reaches Close before it can leave the panel. */ }
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="xs"
				className="jetpack-ai-skill-panel__header"
			>
				<IconButton
					icon={ close }
					label={ __( 'Close', 'jetpack' ) }
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ onClose }
				/>
			</Stack>
		</section>
	);
}

/**
 * Close the panel from its own controls: the X and Escape.
 */
function closePanel() {
	closeSkillPanel();
}

/**
 * The panel boot's inspector renders: the skill the URL names, sent through
 * the same hand-off as Discover's cards.
 *
 * @return {object|null} The panel, or nothing while no skill is open.
 */
export default function DiscoverSkillPanel() {
	const slug = useOpenSkillSlug();
	const skill = slug ? getPanelSkill( slug ) : undefined;
	const showWordPressAgent = useIsWordPressAgentAvailable();
	// As main.jsx decides the hub goes inert behind the panel.
	const isModal = useViewportMatch( 'medium', '<' );
	const isModalRef = useRef( isModal );
	isModalRef.current = isModal;

	// Once per open, whatever opened it: the view is recorded, and a card's
	// View skill (Discover's or the Overview's) moves focus to the title,
	// unless it's already in the panel. Elsewhere a link, an old bookmark,
	// Back or Forward leave focus where the page put it, so a panel that loads
	// with the page draws no focus ring. Covering the hub, the panel always
	// takes focus: everything behind it is inert. The ref keeps StrictMode's
	// second run of the effect from doing it all again.
	const openedRef = useRef( '' );
	useEffect( () => {
		if ( ! slug ) {
			openedRef.current = '';
			return;
		}
		if ( openedRef.current === slug ) {
			return;
		}
		openedRef.current = slug;
		const source = takeOpenSource();
		recordAiHubEvent( EVENTS.DISCOVER_SKILL_VIEWED, { skill: slug, source } );
		const title = document.getElementById( PANEL_TITLE_ID );
		const panel = title?.closest( '.jetpack-ai-skill-panel' );
		if (
			( source !== 'link' || isModalRef.current ) &&
			panel &&
			! panel.contains( panel.ownerDocument.activeElement )
		) {
			title.focus( { preventScroll: true } );
		}
	}, [ slug ] );

	// Its own hand-off, as the panel renders outside Discover's tree. The
	// prompt's Copy is told apart from Send to agent's Copy in Tracks.
	const { send, copyPrompt, siteName } = useSendSkill( { location: 'panel' } );
	const handleCopy = useCallback( item => copyPrompt( item, 'panel_prompt' ), [ copyPrompt ] );

	if ( ! skill ) {
		return null;
	}
	return (
		<SkillPanel
			skill={ skill }
			prompt={ buildPrompt( skill, siteName ) }
			onSend={ send }
			onCopy={ handleCopy }
			showWordPressAgent={ showWordPressAgent }
			onClose={ closePanel }
			isModal={ isModal }
		/>
	);
}
