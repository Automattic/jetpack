import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { features } from '../../../utils/constants';
import { SharePostForm, SharePostFormProps } from '../../form/share-post-form';

type PerNetworkCustomizationFormProps = {
	connection: Connection;
};

const CONNECTION_TEMPLATE_HELP = __(
	'Connection template will be used if empty.',
	'jetpack-publicize-pkg'
);
const GLOBAL_TEMPLATE_HELP = __(
	'Global template will be used if empty.',
	'jetpack-publicize-pkg'
);
const DEFAULT_NETWORK_TEMPLATE_HELP = __(
	'The default network template will be used if empty.',
	'jetpack-publicize-pkg'
);

/**
 * Per-Network Customization Form component.
 *
 * @param {PerNetworkCustomizationFormProps} props - The component props.
 * @return - Per-Network Customization Form component.
 */
export function PerNetworkCustomizationForm( { connection }: PerNetworkCustomizationFormProps ) {
	const { customizeConnectionById } = useDispatch( socialStore );
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const { shareMessage: globalMessage } = usePostMeta();
	const globalMessageTemplate = useSelect(
		select => select( socialStore ).getSocialSettings().messageTemplate,
		[]
	);

	const hasConnectionMessage = connection.message !== undefined && connection.message !== '';
	const hasConnectionTemplate = Boolean( connection.template );
	const hasGlobalMessageTemplate = Boolean( globalMessageTemplate );

	let message = connection.message ?? globalMessage ?? '';
	let fallbackHelp: string | undefined;

	if ( templatesEnabled ) {
		message = hasConnectionMessage
			? connection.message ?? ''
			: connection.template ?? globalMessage ?? '';

		if ( hasConnectionTemplate ) {
			fallbackHelp = CONNECTION_TEMPLATE_HELP;
		} else if ( hasGlobalMessageTemplate ) {
			fallbackHelp = GLOBAL_TEMPLATE_HELP;
		} else {
			fallbackHelp = DEFAULT_NETWORK_TEMPLATE_HELP;
		}
	}

	/*
	 * Per-network values come strictly from the connection. We don't fall back to global
	 * media here — uncustomized connections leave `media_source` undefined, which
	 * MediaSectionV2 surfaces as the "Default" option (post-level OG drives the link
	 * preview at publish time).
	 */
	const mediaSource = connection.media_source;
	const attachedMedia = connection.attached_media ?? [];

	const handleMessageChange = useCallback(
		( msg: string ) => {
			customizeConnectionById( connection.connection_id, { message: msg } );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	const handleMediaChange = useCallback< SharePostFormProps[ 'onMediaChange' ] >(
		updates => {
			customizeConnectionById( connection.connection_id, {
				attached_media: updates.attached_media,
				media_source: updates.media_source,
			} );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	return (
		<SharePostForm
			analyticsData={ { location: 'preview-modal' } }
			isInsideNavigatorModal
			disabled={ ! connection.enabled }
			message={ message }
			messageHelp={ fallbackHelp }
			onMessageChange={ handleMessageChange }
			attachedMedia={ attachedMedia }
			onMediaChange={ handleMediaChange }
			mediaSource={ mediaSource }
			attachmentToggleMode="hidden"
		/>
	);
}
