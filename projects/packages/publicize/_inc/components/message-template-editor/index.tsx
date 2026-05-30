import { TextareaControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import PlaceholdersHelp from '../placeholders-help';
import styles from './styles.module.scss';
import type { ReactNode } from 'react';

export type MessageTemplateEditorProps = {
	/** Current template value. */
	value: string;
	/** Called as the user edits the template. */
	onChange: ( value: string ) => void;
	/** Override the default label. */
	label?: string;
	/** Override the textarea placeholder. */
	placeholder?: string;
	/** Override the help text rendered below the textarea. */
	helpText?: ReactNode;
	/** Whether the editor is disabled. */
	disabled?: boolean;
	/** Number of textarea rows. Defaults to 4. */
	rows?: number;
	/** Whether to render the placeholders dropdown. Defaults to true. */
	showPlaceholders?: boolean;
};

const getDefaultPlaceholder = () =>
	sprintf(
		/* translators: %1$s and %2$s are placeholder tokens, e.g. {title} and {url}. */
		__(
			'Write a default share message. Use placeholders like %1$s or %2$s — they’re filled in when posts are shared.',
			'jetpack-publicize-pkg'
		),
		'{title}',
		'{url}'
	);

const getDefaultHelpText = () =>
	createInterpolateElement(
		__(
			'Supports placeholders like <title/> and <url/>. See the list below for all the options.',
			'jetpack-publicize-pkg'
		),
		{
			title: <code>{ '{title}' }</code>,
			url: <code>{ '{url}' }</code>,
		}
	);

/**
 * Shared editor for Publicize message templates.
 *
 * Renders a textarea plus a `<PlaceholdersHelp>` dropdown that lists the
 * placeholder tokens the template engine supports. Used by the global
 * template editor on the Social settings page and by the per-connection
 * override editor.
 *
 * @param {MessageTemplateEditorProps} props - The component's props.
 * @return Element.
 */
export function MessageTemplateEditor( props: MessageTemplateEditorProps ) {
	const {
		value,
		onChange,
		label,
		placeholder,
		helpText,
		disabled,
		rows = 4,
		showPlaceholders = true,
	} = props;
	const resolvedLabel = label ?? __( 'Message template', 'jetpack-publicize-pkg' );
	const resolvedPlaceholder = placeholder ?? getDefaultPlaceholder();
	const resolvedHelpText = helpText ?? getDefaultHelpText();

	return (
		<div className={ styles[ 'message-template-editor' ] }>
			<TextareaControl
				value={ value }
				label={ resolvedLabel }
				onChange={ onChange }
				disabled={ disabled }
				placeholder={ resolvedPlaceholder }
				rows={ rows }
				help={ resolvedHelpText }
				__nextHasNoMarginBottom={ true }
			/>
			{ showPlaceholders && <PlaceholdersHelp /> }
		</div>
	);
}
