/**
 * External dependencies
 */
import { BaseControl, Button, ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

const useInsertConsentBlock = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );
	const { insertBlock } = useDispatch( 'core/block-editor' );

	const insertConsentBlock = useCallback( async () => {
		const buttonBlockIndex = ( selectedBlock.innerBlocks ?? [] ).findIndex(
			( { name } ) => name === 'jetpack/button'
		);
		if ( buttonBlockIndex === -1 ) {
			return;
		}

		const newConsentBlock = await createBlock( 'jetpack/field-consent' );
		await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
	}, [ insertBlock, selectedBlock.clientId, selectedBlock.innerBlocks ] );

	return { insertConsentBlock };
};

const NoConsentBlockSettings = () => {
	const { insertConsentBlock } = useInsertConsentBlock();

	const [ numberOfContacts, setNumberOfContacts ] = useState( 0 );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/feedback?per_page=1', parse: false } )
			.then( request => request.headers.get( 'X-WP-Total' ) )
			.then( Number.parseInt )
			.then( setNumberOfContacts );
	}, [] );

	return (
		<>
			{ numberOfContacts >= 10 ? (
				<p>
					{ sprintf(
						__(
							'You’ve already collected %d email contacts. Why not make sure you have permission to email them too?',
							'jetpack'
						),
						numberOfContacts
					) }
				</p>
			) : (
				<p>
					{ __(
						'You’re already collecting email contacts. Why not make sure you have permission to email them too?',
						'jetpack'
					) }
				</p>
			) }
			<Button isSecondary onClick={ insertConsentBlock } style={ { marginBottom: '1em' } }>
				{ __( 'Add email permission request', 'jetpack' ) }
			</Button>
		</>
	);
};

const NewsletterIntegrationSettings = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );

	const hasConsentBlock = useMemo(
		() => selectedBlock.innerBlocks.some( ( { name } ) => name === 'jetpack/field-consent' ),
		[ selectedBlock.innerBlocks ]
	);

	return (
		<BaseControl>
			{ ! hasConsentBlock && <NoConsentBlockSettings /> }
			<p>
				<em>
					{ __(
						'To start sending email campaigns, install the Creative Mail plugin for WordPress. ',
						'jetpack'
					) }
					<ExternalLink href="https://wordpress.org/plugins/creative-mail-by-constant-contact/">
						Get the plugin now
					</ExternalLink>
				</em>
			</p>
		</BaseControl>
	);
};

export default NewsletterIntegrationSettings;
