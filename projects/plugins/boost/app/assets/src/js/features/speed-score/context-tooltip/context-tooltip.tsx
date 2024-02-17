import { IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './context-tooltip.module.scss';

const ContextTooltip = () => {
	return (
		<IconTooltip
			title=""
			placement={ 'bottom' }
			className={ styles.tooltip }
			iconSize={ 22 }
			wide={ true }
		>
			<p>
				{ __(
					"Your Overall Score is a summary of your website performance across both mobile and desktop devices. It gives a general idea of your sites' overall performance.",
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
		</IconTooltip>
	);
};

export default ContextTooltip;
