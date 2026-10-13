/* @jsxImportSource react */
import { createInterpolateElement, useId } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, formatBold, formatItalic, link, paragraph, plus } from '@wordpress/icons';
import { Shadow } from './shadow';
import { PREVIEW_CSS } from './styles';
import type { DiscussionSettings, NewsletterSettings, PreviewData } from '../types';
import type { CSSProperties, JSX } from 'react';

interface PreviewProps {
	isJetpackForm: boolean;
	hasBlocks: boolean;
	prompt: string;
	discussion: DiscussionSettings;
	newsletter: NewsletterSettings;
	preview: PreviewData;
}

// An attribute, not a prop: React 18 and 19 disagree on how `inert` is spelled.
const makeInert = ( node: HTMLDivElement | null ) => node?.setAttribute( 'inert', '' );

/**
 * The editor's toolbar as it opens over the box: insert, the block switcher, and the inline formats.
 *
 * @return Toolbar.
 */
function Toolbar(): JSX.Element {
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
 * @param props            - Props.
 * @param props.hasBlocks  - Whether the editor's toolbar shows.
 * @param props.discussion - Core's discussion settings.
 * @param props.preview    - Preview data.
 * @return Form.
 */
function JetpackForm( {
	hasBlocks,
	discussion,
	preview,
}: Pick< PreviewProps, 'hasBlocks' | 'discussion' | 'preview' > ): JSX.Element {
	return (
		<div className="jetpack-comments is-mounted">
			<div className={ hasBlocks ? 'jetpack-comments__box is-open' : 'jetpack-comments__box' }>
				{ hasBlocks && <Toolbar /> }
				<textarea
					className="jetpack-comments__textarea"
					readOnly
					tabIndex={ -1 }
					placeholder={ `${ __( 'Write a comment', 'jetpack-comments' ) }...` }
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
						{ discussion.showAvatars && (
							<img
								className="jetpack-comments__avatar avatar"
								src={ preview.defaultAvatar }
								alt=""
								width="40"
								height="40"
							/>
						) }
						<a href="#preview">
							{ discussion.commentRegistration
								? __( 'Log in with WordPress.com', 'jetpack-comments' )
								: __( 'Add your name', 'jetpack-comments' ) }
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
 * @param props          - Props.
 * @param props.label    - Label.
 * @param props.required - Whether core marks it required.
 * @param props.long     - A textarea rather than a line.
 * @return Field.
 */
function CoreField( {
	label,
	required = false,
	long = false,
}: {
	label: string;
	required?: boolean;
	long?: boolean;
} ): JSX.Element {
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
 * @param props       - Props.
 * @param props.label - Label.
 * @return Checkbox.
 */
function CoreCheckbox( { label }: { label: string } ): JSX.Element {
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
 * @param props            - Props.
 * @param props.discussion - Core's discussion settings.
 * @param props.newsletter - Which subscribe checkboxes Jetpack adds.
 * @return Form.
 */
function CoreForm( {
	discussion,
	newsletter,
}: Pick< PreviewProps, 'discussion' | 'newsletter' > ): JSX.Element {
	if ( discussion.commentRegistration ) {
		return (
			<div className="preview__core">
				<p>
					{ createInterpolateElement(
						__( 'You must be <a>logged in</a> to post a comment.', 'jetpack-comments' ),
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
				{ __( 'Your email address will not be published.', 'jetpack-comments' ) }
				{ required && ` ${ __( 'Required fields are marked *', 'jetpack-comments' ) }` }
			</p>
			<CoreField label={ _x( 'Comment', 'noun', 'jetpack-comments' ) } required long />
			<CoreField label={ __( 'Name', 'jetpack-comments' ) } required={ required } />
			<CoreField label={ __( 'Email', 'jetpack-comments' ) } required={ required } />
			<CoreField label={ __( 'Website', 'jetpack-comments' ) } />
			{ discussion.cookiesOptIn && (
				<CoreCheckbox
					label={ __(
						'Save my name, email, and website in this browser for the next time I comment.',
						'jetpack-comments'
					) }
				/>
			) }
			{ newsletter.active && newsletter.subscribeReplies && (
				<CoreCheckbox
					label={ __( 'Notify me of follow-up comments by email.', 'jetpack-comments' ) }
				/>
			) }
			{ newsletter.active && newsletter.subscribeBlog && (
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

/**
 * The comment form a reader would see with the current settings, in the theme's type and colours.
 *
 * @param props               - Props.
 * @param props.isJetpackForm - Whether the Comments module replaces core's form.
 * @param props.hasBlocks     - Whether readers write in blocks.
 * @param props.prompt        - The heading, or empty for the theme's.
 * @param props.discussion    - Core's discussion settings.
 * @param props.newsletter    - Newsletter's subscribe options.
 * @param props.preview       - Theme tokens and the form's stylesheet.
 * @return Preview.
 */
export function CommentFormPreview( {
	isJetpackForm,
	hasBlocks,
	prompt,
	discussion,
	newsletter,
	preview,
}: PreviewProps ): JSX.Element {
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
					<JetpackForm hasBlocks={ hasBlocks } discussion={ discussion } preview={ preview } />
				) : (
					<CoreForm discussion={ discussion } newsletter={ newsletter } />
				) }
			</div>
		</Shadow>
	);
}
