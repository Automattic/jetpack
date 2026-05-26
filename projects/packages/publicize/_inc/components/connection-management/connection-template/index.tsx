import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite, siteHasFeature } from '@automattic/jetpack-script-data';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useIsModernized } from '../../../hooks/use-is-modernized';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { features } from '../../../utils/constants';
import { MessageTemplateEditor } from '../../message-template-editor';
import styles from './style.module.scss';

type ConnectionTemplateEditorProps = {
	connection: Connection;
};

const SAVE_DEBOUNCE_MS = 1000;

const PLACEHOLDER_TEXT = __(
	'Leave empty to use the default share message.',
	'jetpack-publicize-pkg'
);

const HELP_TEXT = __(
	'Posts shared to this account will use this template instead of the default.',
	'jetpack-publicize-pkg'
);

const LABEL = __( 'Custom message for this connection', 'jetpack-publicize-pkg' );

const NOOP = () => {};

/**
 * Per-connection message template editor.
 *
 * Renders the live editor when the site has the `social-message-templates`
 * feature AND the `social-enhanced-publishing` paid plan, AND the user can
 * manage the connection. On Jetpack sites that don't qualify, renders a
 * disabled-textarea variant with an Upgrade link instead, so free-plan users
 * still see what unlocks with an upgrade.
 *
 * @param {ConnectionTemplateEditorProps} props - The component's props.
 * @return The rendered editor or its locked upsell variant.
 */
export function ConnectionTemplateEditor( props: ConnectionTemplateEditorProps ) {
	const { connection } = props;

	const isModernized = useIsModernized();

	const { canManageConnection, globalTemplate } = useSelect(
		select => ( {
			canManageConnection: select( socialStore ).canUserManageConnection( connection ),
			// Only the modernized chassis renders the gated upsell, which is the
			// only consumer of the global default message. Keeping this read out
			// of the legacy path preserves the trunk data dependencies exactly.
			globalTemplate: isModernized
				? select( socialStore ).getSocialSettings().messageTemplate ?? ''
				: '',
		} ),
		[ connection, isModernized ]
	);

	const { recordEvent } = useAnalytics();

	const onUpgradeClick = useCallback( () => {
		recordEvent( 'jetpack_social_per_network_customization_upgrade_click' );
	}, [ recordEvent ] );

	const savedTemplate = connection.template ?? '';

	const [ draft, setDraft ] = useState( savedTemplate );

	// Track the last value we sent so we can skip the useEffect re-sync when
	// the saved value comes back equal to what our own save just persisted —
	// otherwise a slow save can race with a still-typing user and clobber
	// their edits.
	const lastSentRef = useRef( savedTemplate );

	useEffect( () => {
		if ( savedTemplate !== lastSentRef.current ) {
			setDraft( savedTemplate );
		}
	}, [ savedTemplate ] );

	const { updateConnectionById } = useDispatch( socialStore );

	const persist = useCallback(
		( value: string ) => {
			lastSentRef.current = value;
			updateConnectionById( connection.connection_id, { template: value }, { silent: true } );
		},
		[ connection.connection_id, updateConnectionById ]
	);

	const debouncedSave = useDebounce( persist, SAVE_DEBOUNCE_MS );

	const handleChange = useCallback(
		( value: string ) => {
			setDraft( value );
			debouncedSave( value );
		},
		[ debouncedSave ]
	);

	if ( ! canManageConnection ) {
		return null;
	}

	const featureEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const planEnabled = siteHasFeature( features.ENHANCED_PUBLISHING );

	if ( ! featureEnabled || ! planEnabled ) {
		// The free-plan upsell ships only in the modernized chassis. The legacy
		// admin page and block editor keep the trunk behavior (no editor when
		// the plan/feature is missing).
		if ( ! isModernized || isSimpleSite() ) {
			return null;
		}

		const upgradeUrl = getRedirectUrl( 'jetpack-social-per-connection-template-upsell', {
			site: getSiteFragment() || '',
			query: 'redirect_to=' + encodeURIComponent( window.location.href ),
		} );

		const upsellHelp = createInterpolateElement(
			__(
				'Showing your default share message. To customize it for this account, <a>upgrade your plan</a>.',
				'jetpack-publicize-pkg'
			),
			{
				a: (
					<Link href={ upgradeUrl } onClick={ onUpgradeClick } openInNewTab>
						{ null }
					</Link>
				),
			}
		);

		return (
			<div className={ styles.editor }>
				<MessageTemplateEditor
					label={ LABEL }
					placeholder=""
					helpText={ upsellHelp }
					value={ globalTemplate }
					onChange={ NOOP }
					disabled
					rows={ 3 }
					showPlaceholders={ false }
				/>
			</div>
		);
	}

	return (
		<div className={ styles.editor }>
			<MessageTemplateEditor
				label={ LABEL }
				placeholder={ PLACEHOLDER_TEXT }
				helpText={ HELP_TEXT }
				value={ draft }
				onChange={ handleChange }
				rows={ 3 }
			/>
		</div>
	);
}
