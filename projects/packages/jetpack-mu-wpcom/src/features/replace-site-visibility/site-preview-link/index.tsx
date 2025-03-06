import { ToggleControl } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { getQueryArg, addQueryArgs } from '@wordpress/url';
import { useState } from 'react';

export type SitePreviewLinkObject = {
	code: string;
	created_at: string;
};

interface Props {
	homeUrl: string;
	sitePreviewLink?: SitePreviewLinkObject;
	sitePreviewLinkNonce: string;
	description?: string;
}

const makeSitePreviewLink = ( homeUrl: string, share: string ) => {
	if ( ! share ) {
		return '';
	}

	return addQueryArgs( homeUrl, {
		share,
	} );
};

const SitePreviewLink = ( {
	homeUrl,
	sitePreviewLink: defaultSitePreviewLink,
	sitePreviewLinkNonce,
	description,
}: Props ) => {
	const [ isSitePreviewEnabled, setIsEnabledSitePreview ] = useState( !! defaultSitePreviewLink );
	const [ sitePreviewLink, setSitePreviewLink ] = useState(
		makeSitePreviewLink( homeUrl, defaultSitePreviewLink?.code )
	);
	const [ isLoadingSitePreviewLink, setIsLoadingSitePreviewLink ] = useState( false );
	const [ clipboardCopied, setClipboardCopied ] = useState( false );
	const ref = useCopyToClipboard( sitePreviewLink, () => setClipboardCopied( true ) );

	const generateSitePreviewLink = () => {
		setIsLoadingSitePreviewLink( true );
		const data = new URLSearchParams( {
			action: 'wpcom_generate_site_preview_link',
			_ajax_nonce: sitePreviewLinkNonce,
		} );

		fetch( 'admin-ajax.php', {
			method: 'POST',
			body: data,
		} )
			.then( response => response.json() )
			.then( ( currentSitePreviewLink: SitePreviewLink ) => {
				setSitePreviewLink( makeSitePreviewLink( homeUrl, currentSitePreviewLink.code ) );
				setIsLoadingSitePreviewLink( false );
			} );
	};

	const deleteSitePreviewLink = () => {
		setIsLoadingSitePreviewLink( true );

		const code = getQueryArg( sitePreviewLink, 'share' ) as string | undefined;
		const data = new URLSearchParams( {
			action: 'wpcom_delete_site_preview_link',
			code: code ?? '',
			_ajax_nonce: sitePreviewLinkNonce,
		} );

		fetch( 'admin-ajax.php', {
			method: 'POST',
			body: data,
		} ).then( () => {
			setSitePreviewLink( '' );
			setIsLoadingSitePreviewLink( false );
		} );
	};

	const handleSitePreviewLinkChange = checked => {
		setIsEnabledSitePreview( checked );
		if ( checked ) {
			generateSitePreviewLink();
		} else {
			deleteSitePreviewLink();
		}
	};

	return (
		<ul>
			<li>
				<p>
					{ description }
					{ __(
						'Enable "Share site" to let collaborators without an account view your site.',
						'jetpack-mu-wpcom'
					) }
				</p>
				<ToggleControl
					__nextHasNoMarginBottom
					label={
						<>
							{ __( 'Share site', 'jetpack-mu-wpcom' ) }
							{ isLoadingSitePreviewLink && (
								<img src="images/loading.gif" alt="Loading..." width="16" height="16"></img>
							) }
						</>
					}
					checked={ !! isSitePreviewEnabled }
					disabled={ isLoadingSitePreviewLink }
					onChange={ handleSitePreviewLinkChange }
				/>
			</li>
			{ isSitePreviewEnabled && sitePreviewLink && (
				<li>
					<input type="url" className="regular-text" readOnly value={ sitePreviewLink } />
					<div className="copy-to-clipboard-container">
						<button
							type="button"
							className="button button-small"
							ref={ ref }
							onMouseLeave={ () => setClipboardCopied( false ) }
						>
							{ __( 'Copy URL to clipboard', 'jetpack-mu-wpcom' ) }
						</button>
						{ clipboardCopied && (
							<span className="success" aria-hidden="true">
								{ __( 'Copied!', 'jetpack-mu-wpcom' ) }
							</span>
						) }
					</div>
					<p className="description">
						{ __( 'Anyone with the link can view your site.', 'jetpack-mu-wpcom' ) }
					</p>
				</li>
			) }
		</ul>
	);
};

export default SitePreviewLink;
