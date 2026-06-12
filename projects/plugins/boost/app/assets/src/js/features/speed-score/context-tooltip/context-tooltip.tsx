import { IconTooltip } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
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
			<p>
				{ createInterpolateElement(
					__( '<link>Learn more about how your speed score is measured</link>.', 'jetpack-boost' ),
					{
						link: (
							<Link
								openInNewTab
								href="https://jetpack.com/support/jetpack-boost/how-speed-is-measured/"
							/>
						),
					}
				) }
			</p>
		</IconTooltip>
	);
};

export default ContextTooltip;
