import { Notice } from '@wordpress/ui';
import { dismissScanError, useScanRequest } from './store';

/**
 * Why the last scan request failed, on whichever tab the user started it from.
 *
 * @return The notice, or nothing when the request didn't fail.
 */
export default function ScanStartNotice() {
	const { startError } = useScanRequest();

	if ( ! startError ) {
		return null;
	}

	return (
		<Notice.Root intent="error" className="jp-protect-dashboard__notice">
			<Notice.Description>{ startError }</Notice.Description>
			<Notice.CloseIconButton onClick={ dismissScanError } />
		</Notice.Root>
	);
}
