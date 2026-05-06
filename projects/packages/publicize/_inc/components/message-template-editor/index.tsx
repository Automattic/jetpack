import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
	/** Optional help text rendered below the textarea. */
	helpText?: ReactNode;
	/** Whether the editor is disabled. */
	disabled?: boolean;
	/** Number of textarea rows. Defaults to 4. */
	rows?: number;
};

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
export default function MessageTemplateEditor( props: MessageTemplateEditorProps ) {
	const { value, onChange, label, placeholder, helpText, disabled, rows = 4 } = props;
	const resolvedLabel = label ?? __( 'Message template', 'jetpack-publicize-pkg' );

	return (
		<div className={ styles[ 'message-template-editor' ] }>
			<TextareaControl
				value={ value }
				label={ resolvedLabel }
				onChange={ onChange }
				disabled={ disabled }
				placeholder={ placeholder }
				rows={ rows }
				help={ helpText }
				__nextHasNoMarginBottom={ true }
			/>
			<PlaceholdersHelp />
		</div>
	);
}
