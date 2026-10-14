/* @jsxImportSource react */
import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import { getCommentsScriptData } from './script-data';
import { CommentFormSection } from './sections/comment-form-section';
import { FeaturesSection } from './sections/features-section';
import { RelatedSection } from './sections/related-section';
import { useSettings } from './use-settings';
import type { CommentsScriptData } from './types';
import type { JSX } from 'react';

/**
 * The sections, once the script data is known.
 *
 * @param props            - Props.
 * @param props.scriptData - Script data.
 * @return Sections.
 */
function Sections( { scriptData }: { scriptData: CommentsScriptData } ): JSX.Element {
	const [ settings, save ] = useSettings( scriptData.settings );

	return (
		<>
			<CommentFormSection settings={ settings } save={ save } scriptData={ scriptData } />
			<FeaturesSection
				settings={ settings }
				save={ save }
				modules={ scriptData.modules }
				overrides={ scriptData.overrides }
			/>
			<RelatedSection discussion={ scriptData.discussion } newsletter={ scriptData.newsletter } />
		</>
	);
}

/**
 * Jetpack > Comments.
 *
 * @return Screen.
 */
export function SettingsScreen(): JSX.Element {
	const scriptData = getCommentsScriptData();
	const siteData = getSiteData();

	return (
		<AdminPage
			title={ __( 'Comments', 'jetpack-comments' ) }
			subTitle={ __( 'Choose how readers comment on your posts.', 'jetpack-comments' ) }
			apiRoot={ siteData?.rest_root }
			apiNonce={ siteData?.rest_nonce }
		>
			<Stack direction="column" gap="xl" className="jetpack-comments-settings">
				{ scriptData ? (
					<Sections scriptData={ scriptData } />
				) : (
					<Notice.Root intent="error">
						<Notice.Description>
							{ __(
								'Comments settings could not be loaded. Reload the page to try again.',
								'jetpack-comments'
							) }
						</Notice.Description>
					</Notice.Root>
				) }
			</Stack>
		</AdminPage>
	);
}
