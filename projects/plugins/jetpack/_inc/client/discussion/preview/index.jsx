import { createInterpolateElement, useId } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, formatBold, formatItalic, link, paragraph, plus } from '@wordpress/icons';
import Shadow from './shadow';
import { PREVIEW_CSS } from './styles';

// An attribute, not a prop: React 18 and 19 disagree on how `inert` is spelled.
const makeInert = node => node?.setAttribute( 'inert', '' );

/**
 * The editor's toolbar as it opens over the box: insert, the block switcher, and the inline formats.
 *
 * @return {object} Toolbar.
 */
function Toolbar() {
	const groups = [ [ plus ], [ paragraph ], [ formatBold, formatItalic, link ] ];

	return (
		<div className="preview__toolbar">
			{ groups.map( ( icons, index ) => (
				<span key={ index } className="preview__toolbar-group">
					{ icons.map( ( icon, iconIndex ) => (
						<span key={ iconIndex } className="preview__toolbar-button">
							<Icon icon={ icon } />
						</span>
					) ) }
				</span>
			) ) }
		</div>
	);
}

/**
 * Jetpack's box as a reader first sees it, in the real form's markup so its stylesheet applies.
 *
 * @param {object}  props               - Props.
 * @param {boolean} props.hasBlocks     - Whether the editor's toolbar shows.
 * @param {object}  props.discussion    - Core's discussion settings.
 * @param {string}  props.defaultAvatar - Avatar URL.
 * @return {object} Form.
 */
function JetpackForm( { hasBlocks, discussion, defaultAvatar } ) {
	return (
		<div className="jetpack-comments is-mounted">
			<div className={ hasBlocks ? 'jetpack-comments__box is-open' : 'jetpack-comments__box' }>
				{ hasBlocks && <Toolbar /> }
				<textarea
					className="jetpack-comments__textarea"
					readOnly
					tabIndex={ -1 }
					placeholder={ `${ __( 'Write a comment', 'jetpack' ) }...` }
				/>
				<div className="jetpack-comments__actions">
					<span className="jetpack-comments__submit">
						<input
							type="submit"
							className="submit preview__button"
							value={ _x( 'Comment', 'verb', 'jetpack' ) }
							disabled
						/>
					</span>
					<span className="jetpack-comments__identity">
						{ discussion.showAvatars && (
							<img
								className="jetpack-comments__avatar avatar"
								src={ defaultAvatar }
								alt=""
								width="40"
								height="40"
							/>
						) }
						<a href="#preview">
							{ discussion.commentRegistration
								? __( 'Log in with WordPress.com', 'jetpack' )
								: __( 'Add your name', 'jetpack' ) }
						</a>
					</span>
				</div>
			</div>
		</div>
	);
}

/**
 * A field of core's plain form.
 *
 * @param {object}  props          - Props.
 * @param {string}  props.label    - Label.
 * @param {boolean} props.required - Whether core marks it required.
 * @param {boolean} props.long     - A textarea rather than a line.
 * @return {object} Field.
 */
function CoreField( { label, required = false, long = false } ) {
	const id = useId();

	return (
		<p>
			<label htmlFor={ id }>
				{ label }
				{ required && <span aria-hidden="true"> *</span> }
			</label>
			{ long ? (
				<textarea id={ id } rows={ 5 } readOnly tabIndex={ -1 } />
			) : (
				<input id={ id } type="text" readOnly tabIndex={ -1 } />
			) }
		</p>
	);
}

/**
 * A checkbox line of core's plain form.
 *
 * @param {object} props       - Props.
 * @param {string} props.label - Label.
 * @return {object} Checkbox.
 */
function CoreCheckbox( { label } ) {
	const id = useId();

	return (
		<p className="preview__checkbox">
			<input id={ id } type="checkbox" readOnly tabIndex={ -1 } />
			<label htmlFor={ id }>{ label }</label>
		</p>
	);
}

/**
 * Core's comment form as WordPress draws it for a visitor, which the theme styles on the site.
 *
 * @param {object} props            - Props.
 * @param {object} props.discussion - Core's discussion settings.
 * @param {object} props.newsletter - Which subscribe checkboxes Jetpack adds.
 * @return {object} Form.
 */
function CoreForm( { discussion, newsletter } ) {
	if ( discussion.commentRegistration ) {
		return (
			<div className="preview__core">
				<p>
					{ createInterpolateElement(
						__( 'You must be <a>logged in</a> to post a comment.', 'jetpack' ),
						{ a: <a href="#preview" /> }
					) }
				</p>
			</div>
		);
	}

	const required = discussion.requireNameEmail;

	return (
		<div className="preview__core">
			<p className="preview__note">
				{ __( 'Your email address will not be published.', 'jetpack' ) }
				{ required && ` ${ __( 'Required fields are marked *', 'jetpack' ) }` }
			</p>
			<CoreField label={ _x( 'Comment', 'noun', 'jetpack' ) } required long />
			<CoreField label={ __( 'Name', 'jetpack' ) } required={ required } />
			<CoreField label={ __( 'Email', 'jetpack' ) } required={ required } />
			<CoreField label={ __( 'Website', 'jetpack' ) } />
			{ discussion.cookiesOptIn && (
				<CoreCheckbox
					label={ __(
						'Save my name, email, and website in this browser for the next time I comment.',
						'jetpack'
					) }
				/>
			) }
			{ newsletter.subscribeReplies && (
				<CoreCheckbox label={ __( 'Notify me of follow-up comments by email.', 'jetpack' ) } />
			) }
			{ newsletter.subscribeBlog && (
				<CoreCheckbox label={ __( 'Notify me of new posts by email.', 'jetpack' ) } />
			) }
			<p>
				<input
					type="submit"
					className="preview__button"
					value={ __( 'Post Comment', 'jetpack' ) }
					readOnly
					tabIndex={ -1 }
				/>
			</p>
		</div>
	);
}

/**
 * The comment form a reader would see with the current settings, in the theme's type and colors.
 *
 * @param {object}  props               - Props.
 * @param {boolean} props.isJetpackForm - Whether the Comments module replaces core's form.
 * @param {boolean} props.hasBlocks     - Whether readers write in blocks.
 * @param {string}  props.prompt        - The heading, or empty for the theme's.
 * @param {object}  props.newsletter    - Which subscribe checkboxes the Newsletter adds.
 * @param {object}  props.preview       - Theme tokens, the form's stylesheet, and core's discussion options.
 * @return {object} Preview.
 */
export default function CommentFormPreview( {
	isJetpackForm,
	hasBlocks,
	prompt,
	newsletter,
	preview,
} ) {
	const defaultHeading = __( 'Leave a Reply', 'jetpack' );

	return (
		<Shadow
			style={ preview.theme ?? {} }
			label={ __( 'Preview of the comment form readers see', 'jetpack' ) }
		>
			{ preview.styleUrl && <link rel="stylesheet" href={ preview.styleUrl } /> }
			<style>{ PREVIEW_CSS }</style>
			{ /* A picture of the form: nothing in it takes focus or clicks. */ }
			<div className="preview" ref={ makeInert }>
				<h3 className="preview__heading">
					{ ( isJetpackForm && prompt.trim() ) || defaultHeading }
				</h3>
				{ isJetpackForm ? (
					<JetpackForm
						hasBlocks={ hasBlocks }
						discussion={ preview.discussion }
						defaultAvatar={ preview.defaultAvatar }
					/>
				) : (
					<CoreForm discussion={ preview.discussion } newsletter={ newsletter } />
				) }
			</div>
		</Shadow>
	);
}
