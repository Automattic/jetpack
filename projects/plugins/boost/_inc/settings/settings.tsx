import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import { useModulesState } from '../lib/use-modules-state';
import CodeLoadingSection from './code-loading-section';
import CornerstoneSection from './cornerstone-section';
import ImageCdnSection from './image-cdn-section';
import ImageGuideSection from './image-guide-section';
import './settings.scss';

/**
 * Settings tab body — four section cards in the order specified by
 * the design IA: Cornerstone pages → Code loading optimization →
 * Image CDN configuration → Image guide. Each section card owns a
 * single `Card.Header` with the section title and a body that
 * stacks one or more `ModuleRow`s, each with its own toggle,
 * description, optional subrow, and optional sub-feature panel.
 *
 * LCP optimization rides with the Cornerstone section rather than
 * its own "Image loading optimization" section — both pieces are
 * keyed off the cornerstone-pages list and that grouping
 * communicates the relationship clearly.
 *
 * @return The Settings tab content.
 */
export default function Settings(): JSX.Element {
	const modulesQuery = useModulesState();
	const isLoading = modulesQuery.isLoading;
	const modulesState = modulesQuery.data ?? undefined;

	return (
		<div className="jetpack-boost-settings">
			{ modulesQuery.isError && (
				<Notice.Root intent="error">
					<Notice.Title>
						{ __( "Couldn't load your Boost settings", 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'Refresh the page to try again. If the problem persists, check that your site is reachable.',
							'jetpack-boost'
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			{ isLoading && ! modulesState ? (
				<div className="jetpack-boost-settings__loading">
					<Spinner />
				</div>
			) : (
				<Stack direction="column" gap="lg">
					<CornerstoneSection modulesState={ modulesState } isLoading={ isLoading } />
					<CodeLoadingSection modulesState={ modulesState } isLoading={ isLoading } />
					<ImageCdnSection modulesState={ modulesState } isLoading={ isLoading } />
					<ImageGuideSection modulesState={ modulesState } isLoading={ isLoading } />
				</Stack>
			) }
		</div>
	);
}
