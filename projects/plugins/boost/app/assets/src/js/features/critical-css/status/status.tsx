import { __, _n, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { Notice } from '@wordpress/ui';
import { Link } from 'react-router';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import TimeAgo from '../time-ago/time-ago';
import { useRegenerateCriticalCssAction } from '../lib/stores/critical-css-state';
import { getProvidersWithErrors } from '../lib/critical-css-errors';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { FC } from 'react';

type StatusTypes = {
	cssState: CriticalCssState;
	isCloud?: boolean;
	showFatalError: boolean;
	highlightRegenerateButton?: boolean;
	extraText?: string; // Optionally, provide a sentence to use after the main message to provide more context.
	overrideText?: string; // Optionally, provide a custom message to display instead of the default.
};

const Status: FC< StatusTypes > = ( {
	cssState,
	isCloud = false,
	showFatalError,
	highlightRegenerateButton = false,
	extraText,
	overrideText,
} ) => {
	const regenerateAction = useRegenerateCriticalCssAction();
	const successCount =
		cssState.providers.filter( provider => provider.status === 'success' ).length || 0;
	const providersWithErrors = getProvidersWithErrors( cssState );

	const handleClickRegenerate = () => {
		recordBoostEvent( 'critical_css_regenerate_clicked', {} );
		regenerateAction.mutate();
	};

	const handleAdvancedClick = () => {
		recordBoostEvent( 'critical_css_advanced_link_clicked', {} );
	};

	if ( showFatalError ) {
		return (
			<ShowStopperError
				supportLink={ ( isCloud && 'https://jetpack.com/contact-support/' ) || undefined }
				cssState={ cssState }
			/>
		);
	}

	const hasErrors = cssState.status !== 'pending' && providersWithErrors.length > 0;
	const successText = overrideText || (
		<>
			{ sprintf(
				/* translators: %d is a number of CSS Files which were successfully generated */
				_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
				successCount
			) }
			{ !! cssState.updated && (
				<>
					{ ' ' }
					<TimeAgo time={ new Date( cssState.updated * 1000 ) } />
				</>
			) }
			{ '. ' }
			{ extraText }
		</>
	);

	// Provide a stable, string-valued spokenMessage so WPDS Notice's internal
	// `useSpokenMessage` skips `renderToString( children )` — that path's hook
	// order shifts when children contain `<TimeAgo>` mid-mutation, which
	// throws "Rendered fewer hooks than expected" inside the Notice.
	const successSpokenMessage =
		typeof overrideText === 'string'
			? overrideText
			: sprintf(
					/* translators: %d is a number of CSS Files which were successfully generated */
					_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
					successCount
			  );

	return (
		<>
			<Notice.Root intent="success" spokenMessage={ successSpokenMessage }>
				<Notice.Description>{ successText }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						variant={ highlightRegenerateButton ? 'solid' : 'minimal' }
						onClick={ handleClickRegenerate }
						disabled={ cssState.status === 'pending' }
					>
						{ __( 'Regenerate', 'jetpack-boost' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>

			{ hasErrors && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ createInterpolateElement(
							sprintf(
								/* translators: %d is a number of CSS Files which failed to generate */
								_n(
									'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
									'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
									providersWithErrors.length,
									'jetpack-boost'
								),
								providersWithErrors.length
							),
							{
								advanced: <Link to="/critical-css-advanced" onClick={ handleAdvancedClick } />,
							}
						) }
					</Notice.Description>
				</Notice.Root>
			) }
		</>
	);
};

export default Status;
