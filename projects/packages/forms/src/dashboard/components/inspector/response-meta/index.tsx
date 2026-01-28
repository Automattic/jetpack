/**
 * External dependencies
 */
import {
	ExternalLink,
	Tooltip,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CopyClipboardButton from '../../../components/copy-clipboard-button/index.tsx';
import Gravatar from '../../../components/gravatar/index.tsx';
import { getPath } from '../../../inbox/utils.js';
import TextWithFlag from '../../text-with-flag/index.tsx';
import type { FormResponse } from '../../../../types/index.ts';
import './style.scss';

const getDisplayName = ( response: FormResponse ) => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
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
const ResponseMeta = ( { response }: ResponseMetaProps ): import('react').JSX.Element => {
	const displayName = getDisplayName( response );
	// Match the data view gravatar logic: use email or IP, and set defaultImage conditionally
	const gravatarEmail = response.author_email || response.ip;
	const defaultImage = response.author_name || response.author_email ? 'initials' : 'mp';

	const responseAuthorEmailParts = response.author_email?.split( '@' ) ?? [];

	return (
		<>
			<div className="jp-forms__inbox-response-header">
				<HStack alignment="topLeft" spacing="3">
					<Gravatar
						email={ gravatarEmail }
						defaultImage={ defaultImage }
						displayName={ displayName }
						key={ gravatarEmail }
					/>
					<VStack spacing="0" className="jp-forms__inbox-response-header-title">
						<h3 className="jp-forms__inbox-response-name">{ displayName }</h3>
						{ response.author_email && displayName !== response.author_email && (
							<p className="jp-forms__inbox-response-email">
								<a href={ `mailto:${ response.author_email }` }>
									{ responseAuthorEmailParts[ 0 ] }
									<wbr />@{ responseAuthorEmailParts[ 1 ] }
								</a>
								<CopyClipboardButton text={ response.author_email } />
							</p>
						) }
					</VStack>
				</HStack>
			</div>

			<div className="jp-forms__inbox-response-meta">
				<table>
					<tbody>
						<tr>
							<th>{ __( 'Date:', 'jetpack-forms' ) }</th>
							<td>
								{ sprintf(
									/* Translators: %1$s is the date, %2$s is the time. */
									__( '%1$s at %2$s', 'jetpack-forms' ),
									dateI18n( getDateSettings().formats.date, response.date ),
									dateI18n( getDateSettings().formats.time, response.date )
								) }
							</td>
						</tr>
						<tr>
							<th>{ __( 'Source:', 'jetpack-forms' ) }</th>
							<td>
								{ response.entry_permalink && (
									<ExternalLink href={ response.entry_permalink }>
										{ decodeEntities( response.entry_title ) || getPath( response ) }
									</ExternalLink>
								) }
								{ ! response.entry_permalink && decodeEntities( response.entry_title ) }
							</td>
						</tr>
						<tr>
							<th>{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;</th>
							<td>
								<TextWithFlag countryCode={ response.country_code }>
									<Tooltip text={ __( 'Lookup IP address', 'jetpack-forms' ) }>
										<ExternalLink
											href={ `https://apps.db.ripe.net/db-web-ui/query?searchtext=/${ response.ip }` }
										>
											{ response.ip }
										</ExternalLink>
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
					</tbody>
				</table>
			</div>
		</>
	);
};

export default ResponseMeta;
