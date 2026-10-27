import { useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import { storeName } from '../../store';
import { Statistics as BaseStatistics } from '../../../components/statistics';

export function Statistics(): JSX.Element {
	const { automation } = useSelect(
		select => ( {
			automation: select( storeName ).getAutomationData(),
		} ),
		[]
	);

	return (
		<div className="mailpoet-automation-editor-stats">
			<BaseStatistics
				items={ [
					{
						key: 'entered',
						// translators: Total number of subscribers who entered an automation
						label: _x( 'Total Entered', 'automation stats', 'mailpoet' ),
						value: automation.stats.totals.entered,
					},
					{
						key: 'processing',
						// translators: Total number of subscribers who are being processed in an automation
						label: _x( 'Total Processing', 'automation stats', 'mailpoet' ),
						value: automation.stats.totals.in_progress,
					},
					{
						key: 'exited',
						// translators: Total number of subscribers who exited an automation, no matter the result
						label: _x( 'Total Exited', 'automation stats', 'mailpoet' ),
						value: automation.stats.totals.exited,
					},
				] }
			/>
		</div>
	);
}
