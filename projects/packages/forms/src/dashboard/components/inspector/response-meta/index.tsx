/**
 * External dependencies
 */
import Gravatar from '@automattic/jetpack-components/gravatar';
import { Tooltip } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Badge, Link, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import CopyClipboardButton from '../../../components/copy-clipboard-button/index.tsx';
import { getPath } from '../../../inbox/utils.js';
import TextWithFlag from '../../text-with-flag/index.tsx';
import type { FormResponse } from '../../../../types/index.ts';
import './style.scss';

const getDisplayName = ( response: FormResponse ) => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

/**
 * Render the contents of the Source cell for a feedback response.
 *
 * Test responses (submitted from form preview) link to the preview URL when
 * one is available; otherwise they fall through to a plain "Form Preview"
 * label. Real responses link to the page that hosted the form.
 *
 * @param props          - Component props.
 * @param props.response - The feedback response.
 * @return Source cell content.
 */
const SourceCell = ( { response }: { response: FormResponse } ) => {
	if ( response.is_test ) {
		const label = __( 'Form preview', 'jetpack-forms' );
		if ( response.preview_url ) {
			return (
				<Link openInNewTab href={ response.preview_url }>
					{ label }
				</Link>
			);
		}
		return <>{ label }</>;
	}

	if ( response.entry_permalink ) {
		return (
			<Link openInNewTab href={ response.entry_permalink }>
				{ decodeEntities( response.entry_title ) || getPath( response ) }
			</Link>
		);
	}

	return <>{ decodeEntities( response.entry_title ) }</>;
};

export type ResponseMetaProps = {
	response: FormResponse;
};

/**
 * Renders the response meta information including header and metadata.
 *
 * @param {object} props          - The props object.
 * @param {object} props.response - The response item.
 * @return {import('react').JSX.Element} The response meta component.
 */
const ResponseMeta = ( { response }: ResponseMetaProps ): import( 'react' ).JSX.Element => {
	const dateSettings = getDateSettings();
	const displayName = getDisplayName( response );
	// Match the data view gravatar logic: use email or IP, and set defaultImage conditionally
	const gravatarEmail = response.author_email || response.ip;
	const gravatarDisplayName = response.author_name
		? decodeEntities( response.author_name )
		: response.author_email?.split( '@' )[ 0 ];
	const defaultImage = gravatarDisplayName ? 'initials' : 'mp';

	const responseAuthorEmailParts = response.author_email?.split( '@' ) ?? [];

	// Logged-in user row content: either shows display name and ID, username and ID, or just the ID.
	const loggedInUser = response?.logged_in_user?.id ? response.logged_in_user : null;
	const loggedInUserName = loggedInUser?.display_name || loggedInUser?.username || null;
	let loggedInUserDisplay = null;
	if ( loggedInUser ) {
		loggedInUserDisplay = loggedInUserName
			? `${ loggedInUserName } (#${ loggedInUser.id })`
			: `#${ loggedInUser.id }`;
	}

	return (
		<div className="jp-forms__inbox-response-meta">
			<Stack align="flex-start" direction="row" gap="md" justify="flex-start" wrap="nowrap">
				<Gravatar
					email={ gravatarEmail }
					defaultImage={ defaultImage }
					displayName={ gravatarDisplayName }
					key={ gravatarEmail }
				/>
				{ /* `justify` centres a short name against the 48px avatar, which VStack did by
				     default and Stack does not. No `gap`: the old spacing="0" has no token. */ }
				<Stack className="jp-forms__inbox-response-meta-from" direction="column" justify="center">
					<Stack align="center" direction="row" gap="sm" justify="start">
						<Text className="jp-forms__inbox-response-meta-from-name" variant="heading-lg">
							{ displayName }
						</Text>
						{ response.is_test && (
							<Badge intent="none" aria-label={ __( 'Test response', 'jetpack-forms' ) }>
								{ __( 'Test', 'jetpack-forms' ) }
							</Badge>
						) }
					</Stack>
					{ response.author_email && displayName !== response.author_email && (
						<Stack
							align="center"
							className="jp-forms__inbox-response-meta-from-email"
							direction="row"
							gap="sm"
							justify="start"
						>
							<Text render={ <a href={ `mailto:${ response.author_email }` } /> } variant="body-md">
								{ responseAuthorEmailParts[ 0 ] }
								<wbr />@{ responseAuthorEmailParts[ 1 ] }
							</Text>
							<CopyClipboardButton text={ response.author_email } />
						</Stack>
					) }
				</Stack>
			</Stack>
			<table className="jp-forms__inbox-response-meta-table">
				<tbody>
					<tr>
						<th>{ __( 'Date:', 'jetpack-forms' ) }</th>
						<td>{ dateI18n( dateSettings.formats.datetime, response.date ) }</td>
					</tr>
					<tr>
						<th>{ __( 'Source:', 'jetpack-forms' ) }</th>
						<td>
							<SourceCell response={ response } />
						</td>
					</tr>
					<tr>
						<th>{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;</th>
						<td>
							<TextWithFlag countryCode={ response.country_code }>
								<Tooltip text={ __( 'Lookup IP address', 'jetpack-forms' ) }>
									<Link
										openInNewTab
										href={ `https://apps.db.ripe.net/db-web-ui/query?searchtext=${ encodeURIComponent(
											response.ip
										) }` }
									>
										{ response.ip }
									</Link>
								</Tooltip>
							</TextWithFlag>
						</td>
					</tr>
					{ response.browser && (
						<tr>
							<th>{ __( 'Browser:', 'jetpack-forms' ) }&nbsp;</th>
							<td>{ response.browser }</td>
						</tr>
					) }
					{ loggedInUserDisplay && (
						<tr>
							<th>{ __( 'Logged-in user:', 'jetpack-forms' ) }&nbsp;</th>
							<td>{ loggedInUserDisplay }</td>
						</tr>
					) }
				</tbody>
			</table>
		</div>
	);
};

export default ResponseMeta;
