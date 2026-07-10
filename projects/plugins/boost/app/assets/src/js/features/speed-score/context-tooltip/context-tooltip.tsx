import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/ui';
import InfoIcon from '$svg/info';
import styles from './context-tooltip.module.scss';

const ContextTooltip = () => {
	return (
		<Popover.Root>
			<Popover.Trigger
				className={ styles[ 'tooltip-trigger' ] }
				aria-label={ __( 'More information', 'jetpack-boost' ) }
			>
				<InfoIcon />
			</Popover.Trigger>
			<Popover.Popup className={ styles.tooltip }>
				<p>
					{ __(
						"Your Overall Score is a summary of your first Cornerstone Page across both mobile and desktop devices. It gives a general idea of your site's overall performance.",
						'jetpack-boost'
					) }
				</p>
				<table className={ styles.table }>
					<tbody>
						<tr>
							<th>A</th>
							<td>90+</td>
						</tr>
						<tr>
							<th>B</th>
							<td>75 - 90</td>
						</tr>
						<tr>
							<th>C</th>
							<td>50 - 75</td>
						</tr>
					</tbody>
				</table>
				<table className={ styles.table }>
					<tbody>
						<tr>
							<th>D</th>
							<td>35 - 50</td>
						</tr>
						<tr>
							<th>E</th>
							<td>25 - 35</td>
						</tr>
						<tr>
							<th>F</th>
							<td>0 - 25</td>
						</tr>
					</tbody>
				</table>
			</Popover.Popup>
		</Popover.Root>
	);
};

export default ContextTooltip;
