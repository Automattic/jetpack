import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TextareaControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useRef } from 'react';
import { features } from '../../utils/constants';
import PlaceholdersHelp from '../placeholders-help';
import styles from './styles.module.scss';
import type { ReactNode } from 'react';

export const getPlaceholderText = () =>
	__(
		'Write a custom message for your social audience here. This message will override your social post content.',
		'jetpack-publicize-pkg'
	);

export const getTemplatesPlaceholderText = () =>
	sprintf(
		/* translators: %1$s and %2$s are placeholders for the post. e.g. {title} and {url}. */
		__(
			'Customize how this post is shared. Use placeholders like %1$s or %2$s - those will be filled in when the post is shared.',
			'jetpack-publicize-pkg'
		),
		'{title}',
		'{url}'
	);

export const getDefaultLabel = () => __( 'Message', 'jetpack-publicize-pkg' );

export type MessageBoxControlProps = {
	/** The label for the message box */
	label: string;

	/** The placeholder text for the message box */
	placeholder?: string;

	/** Optional help text override */
	help?: ReactNode;

	/** The message to display */
	message: string;

	/** Callback to invoke as the message changes */
	onChange: ( message: string ) => void;

	/** Whether the control is disabled */
	disabled?: boolean;

	/** The maximum character length of the message */
	maxLength: number;

	/** Data for tracking analytics */
	analyticsData?: {
		/** The location of the analytics event */
		location: string;
	};
};

/**
 * Wrapper around a textbox to restrict the number of characters and
 * display how many are remaining.
 *
 * @param {MessageBoxControlProps} props - The component's props.
 * @return {object} The message box component.
 */
export default function MessageBoxControl( {
	label = getDefaultLabel(),
	placeholder,
	help: helpProp,
	message = '',
	onChange,
	disabled,
	maxLength,
	analyticsData = null,
}: MessageBoxControlProps ) {
	const { recordEvent } = useAnalytics();
	const isFirstChange = useRef( true );

	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );

	const charactersRemaining = maxLength - message.length;

	const handleChange = useCallback(
		newMessage => {
			onChange( newMessage );
			if ( isFirstChange.current ) {
				recordEvent( 'jetpack_social_custom_message_changed', analyticsData );
				isFirstChange.current = false;
			}
		},
		[ analyticsData, isFirstChange, onChange, recordEvent ]
	);

	const resolvedPlaceholder =
		placeholder ?? ( templatesEnabled ? getTemplatesPlaceholderText() : getPlaceholderText() );

	// When templates are enabled, the message can contain placeholders that expand
	// at share time, so the raw textarea length isn't a meaningful character budget.
	// Skip both the maxLength cap and the "characters remaining" counter, and instead
	// wire the help slot to a placeholder-aware description that screen readers will
	// announce via aria-describedby (which BaseControl sets on the textarea).
	const help =
		helpProp ??
		( templatesEnabled
			? createInterpolateElement(
					__(
						'Supports placeholders like <title/> and <url/>. See the list below for all the options.',
						'jetpack-publicize-pkg'
					),
					{
						title: <code>{ '{title}' }</code>,
						url: <code>{ '{url}' }</code>,
					}
			  )
			: sprintf(
					/* translators: %d: the number of characters remaining. */
					_n(
						'%d character remaining',
						'%d characters remaining',
						charactersRemaining,
						'jetpack-publicize-pkg'
					),
					charactersRemaining
			  ) );

	return (
		<div className={ styles[ 'message-box-control' ] }>
			<TextareaControl
				value={ message }
				label={ label }
				onChange={ handleChange }
				disabled={ disabled }
				maxLength={ templatesEnabled ? undefined : maxLength }
				placeholder={ resolvedPlaceholder }
				rows={ 4 }
				help={ help }
				__nextHasNoMarginBottom={ true }
			/>
			{ templatesEnabled && <PlaceholdersHelp /> }
		</div>
	);
}
