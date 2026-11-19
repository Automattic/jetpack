/**
 * A skill in the catalog: icon, title, description, the Send to agent menu and
 * a chevron. Anywhere else on the card opens the skill's panel.
 */

import { useCallback, useId } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Badge, Icon, Text, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { getCategoryIcon } from './category-icons';
import SendToAgentMenu from './send-to-agent';
import { FIRST_SKILL_SLUG, getCategoryName } from './skills';

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
 * The badge on the skill Discover suggests running first, shared by the card
 * and the skill's panel. Nothing for any other skill.
 *
 * @param {object} props      - Component props.
 * @param {string} props.slug - The skill's slug.
 * @return {object|null} Component markup.
 */
export function FirstSkillBadge( { slug } ) {
	if ( slug !== FIRST_SKILL_SLUG ) {
		return null;
	}
	return <Badge intent="informational">{ __( 'Great first skill', 'jetpack' ) }</Badge>;
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
 * @param {string}   [props.layout]           - 'grid' for a card, 'list' for a row.
 * @return {object} Component markup.
 */
export default function SkillCard( {
	skill,
	onView,
	isOpen,
	onSend,
	showWordPressAgent,
	layout = 'grid',
} ) {
	const titleId = useId();
	const handleSend = useCallback( agent => onSend( skill, agent ), [ skill, onSend ] );
	const handleView = useCallback(
		event => {
			// Plain clicks route in place; modified clicks keep the browser's
			// own new-tab behaviour.
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			onView( skill );
		},
		[ skill, onView ]
	);

	return (
		// An article named by its title, so each card reads as one unit. Laid
		// out as My Jetpack's Features card: a link covers the card, and Send to
		// agent sits above it as its own control.
		<article
			className={ clsx(
				'jetpack-ai-discover__card',
				layout === 'list' && 'jetpack-ai-discover__card--row'
			) }
			aria-labelledby={ titleId }
			data-open={ isOpen ? 'true' : undefined }
		>
			<div className="jetpack-ai-discover__card-layout">
				<CategoryTile category={ skill.category } />
				<div className="jetpack-ai-discover__card-text">
					{ /* The badge sits beside the heading rather than in it, so the card
					     is still named by its title alone. */ }
					<div className="jetpack-ai-discover__card-heading-row">
						<Text
							variant="body-md"
							render={ <h3 id={ titleId } /> }
							className="jetpack-ai-discover__card-heading jetpack-ai-discover__card-title"
						>
							{ skill.title }
						</Text>
						<FirstSkillBadge slug={ skill.slug } />
					</div>
					<VisuallyHidden render={ <p /> }>{ getCategoryName( skill.category ) }</VisuallyHidden>
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
					<Icon icon={ isRTL() ? chevronLeft : chevronRight } size={ 24 } />
				</span>
			</div>
		</article>
	);
}
