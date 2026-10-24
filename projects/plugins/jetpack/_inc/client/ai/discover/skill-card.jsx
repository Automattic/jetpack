/**
 * A skill in the catalog: icon, title, blurb, and a footer with the Send to
 * agent menu and a link that opens the skill's panel. In the grid it is a
 * card; in the list it is a row, with the footer's actions at its end.
 */

import { useCallback, useId } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { Badge, Icon, Link, Text, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { CATEGORY_ICONS } from './category-icons';
import SendToAgentMenu from './send-to-agent';
import { CATEGORY_LABELS, FIRST_SKILL_SLUG } from './skills';

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
			<Icon icon={ CATEGORY_ICONS[ category ] } size={ 20 } />
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
		// out like My Jetpack's Features card, with the actions in a footer
		// rather than beside the text, since the body opens nothing itself.
		<article
			className={ clsx(
				'jetpack-ai-discover__card',
				layout === 'list' && 'jetpack-ai-discover__card--row'
			) }
			aria-labelledby={ titleId }
			data-open={ isOpen ? 'true' : undefined }
		>
			<div className="jetpack-ai-discover__card-body">
				<CategoryTile category={ skill.category } />
				<div className="jetpack-ai-discover__card-text">
					{ /* heading-md, as the Overview's cards for the same skills. The
					     badge sits beside the heading rather than in it, so the card is
					     still named by its title alone. */ }
					<div className="jetpack-ai-discover__card-heading-row">
						<Text
							variant="heading-md"
							render={ <h3 id={ titleId } /> }
							className="jetpack-ai-discover__card-heading jetpack-ai-discover__card-title"
						>
							{ skill.title }
						</Text>
						<FirstSkillBadge slug={ skill.slug } />
					</div>
					<VisuallyHidden render={ <p /> }>{ CATEGORY_LABELS[ skill.category ] }</VisuallyHidden>
					<Text render={ <p /> } variant="body-md" className="jetpack-ai-discover__muted">
						{ skill.blurb }
					</Text>
				</div>
			</div>
			<div className="jetpack-ai-discover__card-footer">
				{ /* The trigger repeats on every card, so it takes a lighter stroke. */ }
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
				{ /* Named in full by aria-label, as the menu is: a hidden span inside
				     the link is laid out as a block and reads with a stray space.
				     aria-current tells assistive tech which card's panel is open. */ }
				<Link
					href={ `#/discover/${ skill.slug }` }
					className="jetpack-ai-discover__view-link"
					onClick={ handleView }
					aria-label={ sprintf(
						/* translators: %s: skill name, e.g. "SEO audit". */
						__( 'View skill: %s', 'jetpack' ),
						skill.title
					) }
					aria-current={ isOpen ? 'true' : undefined }
				>
					{ __( 'View skill', 'jetpack' ) }
					<Icon icon={ isRTL() ? arrowLeft : arrowRight } size={ 18 } />
				</Link>
			</div>
		</article>
	);
}
