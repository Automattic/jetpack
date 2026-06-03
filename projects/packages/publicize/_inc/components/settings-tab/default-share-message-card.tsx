import { useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { MessageTemplateEditor } from '../message-template-editor';

const SAVE_DEBOUNCE_MS = 1000;

/**
 * Default share message card — global message-template editor.
 *
 * Wraps the shared `MessageTemplateEditor` (also used by the
 * per-connection editor) in a Settings card and handles the same
 * debounced autosave the legacy `MessageTemplateSection` does, so the
 * chassis surface re-homes that editor when the legacy
 * `SocialModuleToggle` retires in PR 5.
 *
 * The parent Settings tab gates the entire card on
 * `siteHasFeature( 'social-message-templates' )` so stickerless sites
 * never see it. That keeps this component free of feature-flag
 * branching — when it renders, the feature is on.
 *
 * @return The card.
 */
export default function DefaultShareMessageCard(): JSX.Element {
	const savedTemplate = useSelect(
		select => select( socialStore ).getSocialSettings().messageTemplate,
		[]
	);

	const { setMessageTemplate } = useDispatch( socialStore );

	const [ draft, setDraft ] = useState( savedTemplate );

	// Track the last value we sent so the resync only fires when the
	// saved value changes for a reason other than our own save resolving.
	const lastSentRef = useRef( savedTemplate );

	useEffect( () => {
		if ( savedTemplate !== lastSentRef.current ) {
			setDraft( savedTemplate );
		}
	}, [ savedTemplate ] );

	const persist = useCallback(
		( value: string ) => {
			lastSentRef.current = value;
			setMessageTemplate( value );
		},
		[ setMessageTemplate ]
	);

	const debouncedSave = useDebounce( persist, SAVE_DEBOUNCE_MS );

	const onChange = useCallback(
		( value: string ) => {
			setDraft( value );
			debouncedSave( value );
		},
		[ debouncedSave ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Default share message', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text variant="body-sm">
						{ __(
							'Set a default message format used when sharing posts to social networks. Use placeholders to insert post details automatically.',
							'jetpack-publicize-pkg'
						) }
					</Text>
					<MessageTemplateEditor value={ draft } onChange={ onChange } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
