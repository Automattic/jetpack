/**
 * A skill in the catalog: icon and arrow, title, category and description,
 * then the Send to agent menu. Anywhere else on the card opens the skill's panel.
 */

import { useCallback, useId } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import { Icon, Text } from '@wordpress/ui';
import { getCategoryIcon } from './category-icons';
import SendToAgentMenu from './send-to-agent';
import { isModifiedClick } from './skill-panel-state';
import { getCategoryName } from './skills';

// jetpack.com/prompts' card arrow, mirrored for right-to-left.
const ARROW_UP_RIGHT = 'M7 17 17 7M8 7h9v9';
const ARROW_UP_LEFT = 'M17 17 7 7M16 7H7v9';

/**
 * The square category tile shared by the card and the skill's panel.
 *
 * @param {object} props          - Component props.
 * @param {string} props.category - Category key.
 * @return {object} Component markup.
 */
export function CategoryTile( { category } ) {
	return (
		<span className="jetpack-ai-discover__tile" aria-hidden="true">
			<Icon icon={ getCategoryIcon( category ) } size={ 20 } />
		</span>
	);
}

/**
 * Skill card.
 *
 * @param {object}   props                    - Component props.
 * @param {object}   props.skill              - The skill.
 * @param {Function} props.onView             - Called with the skill to open its panel.
 * @param {boolean}  [props.isOpen]           - Whether this skill's panel is open.
 * @param {Function} props.onSend             - Called with the skill and the agent key.
 * @param {boolean}  props.showWordPressAgent - Whether to offer the WordPress Agent.
 * @param {number}   [props.headingLevel]     - The title's heading level.
 * @return {object} Component markup.
 */
export default function SkillCard( {
	skill,
	onView,
	isOpen,
	onSend,
	showWordPressAgent,
	headingLevel = 3,
} ) {
	const Heading = `h${ headingLevel }`;
	const titleId = useId();
	const handleSend = useCallback( agent => onSend( skill, agent ), [ skill, onSend ] );
	const handleView = useCallback(
		event => {
			// Plain clicks route in place; modified clicks keep the browser's
			// own new-tab behaviour.
			if ( isModifiedClick( event ) ) {
				return;
			}
			event.preventDefault();
			onView( skill );
		},
		[ skill, onView ]
	);

	return (
		// An article named by its title, so each card reads as one unit. A link
		// covers the card, and Send to agent sits above it as its own control.
		<article
			className="jetpack-ai-discover__card"
			aria-labelledby={ titleId }
			data-open={ isOpen ? 'true' : undefined }
		>
			<div className="jetpack-ai-discover__card-layout">
				<CategoryTile category={ skill.category } />
				<div className="jetpack-ai-discover__card-text">
					<Text
						variant="body-lg"
						render={ <Heading id={ titleId } /> }
						className="jetpack-ai-discover__card-title"
					>
						{ skill.title }
					</Text>
					<Text render={ <p /> } variant="body-sm" className="jetpack-ai-discover__muted">
						{ getCategoryName( skill.category ) }
					</Text>
					<Text
						render={ <p /> }
						variant="body-md"
						className="jetpack-ai-discover__muted jetpack-ai-discover__card-summary"
					>
						{ skill.summary || skill.description }
					</Text>
				</div>
				{ /* Covers the whole card; aria-current marks the open skill. */ }
				<a
					href={ `#/discover/${ skill.slug }` }
					className="jetpack-ai-discover__card-open"
					onClick={ handleView }
					aria-label={ sprintf(
						/* translators: %s: skill name, e.g. "SEO audit". */
						__( 'View skill: %s', 'jetpack' ),
						skill.title
					) }
					aria-current={ isOpen ? 'true' : undefined }
				/>
				<div className="jetpack-ai-discover__card-action">
					<SendToAgentMenu
						variant="minimal"
						className="jetpack-ai-discover__agent-trigger"
						onSend={ handleSend }
						showWordPressAgent={ showWordPressAgent }
						label={ sprintf(
							/* translators: %s: skill name, e.g. "SEO audit". */
							__( 'Send to agent: %s', 'jetpack' ),
							skill.title
						) }
					/>
				</div>
				<span className="jetpack-ai-discover__card-chevron" aria-hidden="true">
					<SVG
						viewBox="0 0 24 24"
						width={ 16 }
						height={ 16 }
						fill="none"
						stroke="currentColor"
						strokeWidth={ 1.75 }
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<Path d={ isRTL() ? ARROW_UP_LEFT : ARROW_UP_RIGHT } />
					</SVG>
				</span>
			</div>
		</article>
	);
}
