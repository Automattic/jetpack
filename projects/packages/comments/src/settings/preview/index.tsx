/* @jsxImportSource react */
import { createInterpolateElement, useId } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, formatBold, formatItalic, link, paragraph, plus } from '@wordpress/icons';
import Shadow from './shadow';
import { PREVIEW_CSS } from './styles';
import type { PreviewData, PreviewUser } from '../types';
import type { CSSProperties, ReactElement } from 'react';

// An attribute, not a prop: React 18 and 19 disagree on how `inert` is spelled.
const makeInert = ( node: HTMLElement | null ) => node?.setAttribute( 'inert', '' );

/**
 * The editor's toolbar as it opens over the box: insert, the block switcher, and the inline formats.
 *
 * @return {JSX.Element} Toolbar.
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

type JetpackFormProps = {
	hasBlocks: boolean;
	showAvatars: boolean;
	user: PreviewUser;
};

/**
 * Jetpack's box as the signed-in admin sees it, in the real form's markup so its stylesheet applies.
 *
 * @param {JetpackFormProps} props - Props.
 * @return {JSX.Element} Form.
 */
function JetpackForm( { hasBlocks, showAvatars, user }: JetpackFormProps ) {
	return (
		<div className="jetpack-comments is-mounted">
			<div className={ hasBlocks ? 'jetpack-comments__box is-open' : 'jetpack-comments__box' }>
				{ hasBlocks && <Toolbar /> }
				<textarea
					className="jetpack-comments__textarea"
					readOnly
					tabIndex={ -1 }
					placeholder={ __( 'Write a comment…', 'jetpack-comments' ) }
				/>
				<div className="jetpack-comments__actions">
					<span className="jetpack-comments__submit">
						<input
							type="submit"
							className="submit preview__button"
							value={ _x( 'Comment', 'verb', 'jetpack-comments' ) }
							disabled
						/>
					</span>
					<span className="jetpack-comments__identity">
						{ showAvatars && user.avatar && (
							<img
								className="jetpack-comments__avatar avatar"
								src={ user.avatar }
								alt=""
								width="40"
								height="40"
							/>
						) }
						<span className="jetpack-comments__profile">
							<a className="jetpack-comments__name" href="#preview">
								{ user.name }
							</a>
							<a className="jetpack-comments__link" href="#preview">
								{ __( 'Log out', 'jetpack-comments' ) }
							</a>
						</span>
					</span>
				</div>
			</div>
		</div>
	);
}

/**
 * The comment field of core's plain form.
 *
 * @return {JSX.Element} Field.
 */
function CoreCommentField() {
	const id = useId();

	return (
		<p>
			<label htmlFor={ id }>
				{ _x( 'Comment', 'noun', 'jetpack-comments' ) }
				<span aria-hidden="true"> *</span>
			</label>
			<textarea id={ id } rows={ 5 } readOnly tabIndex={ -1 } />
		</p>
	);
}

/**
 * A checkbox line of core's plain form.
 *
 * @param {object} props       - Props.
 * @param {string} props.label - Label.
 * @return {JSX.Element} Checkbox.
 */
function CoreCheckbox( { label }: { label: string } ) {
	const id = useId();

	return (
		<p className="preview__checkbox">
			<input id={ id } type="checkbox" readOnly tabIndex={ -1 } />
			<label htmlFor={ id }>{ label }</label>
		</p>
	);
}

type CoreFormProps = {
	user: PreviewUser;
	subscribeBlog: boolean;
	subscribeReplies: boolean;
};

/**
 * Core's comment form as WordPress draws it for a signed-in user, which the theme styles on the site.
 *
 * @param {CoreFormProps} props - Props.
 * @return {JSX.Element} Form.
 */
function CoreForm( { user, subscribeBlog, subscribeReplies }: CoreFormProps ) {
	return (
		<div className="preview__core">
			<p className="preview__note">
				{ createInterpolateElement(
					__(
						'Logged in as <name />. <a>Edit your profile</a>. <a>Log out?</a> Required fields are marked *',
						'jetpack-comments'
					),
					// The type only reads paired tags, so it misses `<name />`.
					{ name: <a href="#preview">{ user.name }</a>, a: <a href="#preview" /> } as Record<
						string,
						ReactElement
					>
				) }
			</p>
			<CoreCommentField />
			{ subscribeReplies && (
				<CoreCheckbox
					label={ __( 'Notify me of follow-up comments by email.', 'jetpack-comments' ) }
				/>
			) }
			{ subscribeBlog && (
				<CoreCheckbox label={ __( 'Notify me of new posts by email.', 'jetpack-comments' ) } />
			) }
			<p>
				<input
					type="submit"
					className="preview__button"
					value={ __( 'Post Comment', 'jetpack-comments' ) }
					readOnly
					tabIndex={ -1 }
				/>
			</p>
		</div>
	);
}

type CommentFormPreviewProps = {
	/** Whether the Comments module replaces core's form. */
	isJetpackForm: boolean;
	/** Whether readers write in blocks. */
	hasBlocks: boolean;
	/** The heading, or empty for the theme's. */
	prompt: string;
	/** Whether the Newsletter adds its subscribe checkboxes to core's form. */
	subscribeBlog: boolean;
	subscribeReplies: boolean;
	preview: PreviewData;
};

/**
 * The comment form the current user would see with the current settings, in the theme's type and colors.
 *
 * @param {CommentFormPreviewProps} props - Props.
 * @return {JSX.Element} Preview.
 */
export default function CommentFormPreview( {
	isJetpackForm,
	hasBlocks,
	prompt,
	subscribeBlog,
	subscribeReplies,
	preview,
}: CommentFormPreviewProps ) {
	const defaultHeading = __( 'Leave a Reply', 'jetpack-comments' );

	return (
		<Shadow
			style={ ( preview.theme ?? {} ) as CSSProperties }
			label={ __( 'Preview of the comment form readers see', 'jetpack-comments' ) }
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
						showAvatars={ preview.showAvatars }
						user={ preview.user }
					/>
				) : (
					<CoreForm
						user={ preview.user }
						subscribeBlog={ subscribeBlog }
						subscribeReplies={ subscribeReplies }
					/>
				) }
			</div>
		</Shadow>
	);
}
