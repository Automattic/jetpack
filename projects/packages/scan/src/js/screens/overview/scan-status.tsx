/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	ProgressBar,
	Spinner,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import type { SiteScanResponse } from '../../data/types';
import type { FC } from 'react';

interface ScanStatusProps {
	state: SiteScanResponse[ 'state' ];
	progress?: number;
}

/**
 * In-progress scan UI shown on the Active threats tab when the scanner
 * is enqueued or running. Renders a spinner + a percentage indicator
 * tied to `current.progress` from `siteScanQuery`. Mirrors the spirit
 * of Calypso's `scan-status.tsx` while staying small — copy will get
 * iterated on with design in Phase 6.
 *
 * @param root0          - Component props.
 * @param root0.state    - Top-level scan state from `/site/scan`.
 * @param root0.progress - Optional 0-100 progress value from `current.progress`.
 * @return The scan-status panel.
 */
const ScanStatus: FC< ScanStatusProps > = ( { state, progress } ) => {
	const heading =
		state === 'enqueued'
			? __( 'Scan queued…', 'jetpack-scan-page' )
			: __( 'Scanning your site…', 'jetpack-scan-page' );

	const body =
		state === 'enqueued'
			? __(
					'Your scan will start shortly. You can leave this page open or come back later.',
					'jetpack-scan-page'
			  )
			: __(
					'Jetpack is reviewing your site for vulnerabilities and suspicious files. This usually takes a few minutes.',
					'jetpack-scan-page'
			  );

	const showProgress = state === 'running' && typeof progress === 'number';

	return (
		<VStack
			alignment="center"
			spacing={ 4 }
			style={ {
				flex: '1 1 auto',
				minBlockSize: 0,
				justifyContent: 'center',
				padding: '48px 24px',
			} }
		>
			<Spinner />
			<Text as="h3" weight="500" size="15">
				{ heading }
			</Text>
			<Text variant="muted" style={ { maxInlineSize: '40ch', textAlign: 'center' } }>
				{ body }
			</Text>
			{ showProgress && (
				<div style={ { inlineSize: 'min(360px, 100%)' } }>
					<ProgressBar value={ Math.max( 0, Math.min( 100, progress ?? 0 ) ) } />
					<Text
						variant="muted"
						size="13"
						style={ { display: 'block', marginBlockStart: 8, textAlign: 'center' } }
					>
						{ sprintf(
							/* translators: %d is the current scan progress as a percentage. */
							__( '%d%% complete', 'jetpack-scan-page' ),
							Math.round( progress ?? 0 )
						) }
					</Text>
				</div>
			) }
		</VStack>
	);
};

export default ScanStatus;
