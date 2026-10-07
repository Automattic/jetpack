import { VisuallyHidden } from '@wordpress/components';
import { LabelValueContent } from '../../../components/tooltip/private/label-value-content';
import type { DataPointPercentageCalculated } from '../../../types';

interface PieSelectionAnnouncementProps {
	/** The keyboard-selected segment, when no tooltip is showing to announce it. */
	data?: DataPointPercentageCalculated;
}

export const PieSelectionAnnouncement = ( { data }: PieSelectionAnnouncementProps ) => (
	<VisuallyHidden role="status" aria-atomic="true">
		{ data && <LabelValueContent data={ data } /> }
	</VisuallyHidden>
);
