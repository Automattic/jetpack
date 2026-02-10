/**
 * External dependencies
 */
import {
	ExternalLink,
	Tooltip,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
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

	const dateSettings = getDateSettings();

	return (
		<div className="jp-forms__inbox-response-meta">
			<HStack alignment="topLeft" spacing="3" wrap={ false }>
				<Gravatar
					email={ gravatarEmail }
					defaultImage={ defaultImage }
					displayName={ displayName }
					key={ gravatarEmail }
				/>
				<VStack spacing="0" className="jp-forms__inbox-response-meta-from">
					<Text
						className="jp-forms__inbox-response-meta-from-name"
						lineHeight="20px"
						size="15px"
						weight="600"
					>
						{ displayName }
					</Text>
					{ response.author_email && displayName !== response.author_email && (
						<HStack
							alignment="center"
							className="jp-forms__inbox-response-meta-from-email"
							justify="start"
						>
							<Text
								as="a"
								href={ `mailto:${ response.author_email }` }
								lineHeight="20px"
								size="13px"
								variant="muted"
								weight="400"
							>
								{ responseAuthorEmailParts[ 0 ] }
								<wbr />@{ responseAuthorEmailParts[ 1 ] }
							</Text>
							<CopyClipboardButton text={ response.author_email } />
						</HStack>
					) }
				</VStack>
			</HStack>
			<table className="jp-forms__inbox-response-meta-table">
				<tbody>
					<tr>
						<th>{ __( 'Date:', 'jetpack-forms' ) }</th>
						<td>{ dateI18n( dateSettings.formats.datetime, response.date ) }</td>
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
										href={ `https://apps.db.ripe.net/db-web-ui/query?searchtext=${ encodeURIComponent(
											response.ip
										) }` }
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
	);
};

export default ResponseMeta;
