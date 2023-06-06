/**
 * External dependencies
 */
import { PanelBody, PanelRow } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import { AIFeatureProps } from '../../hooks/use-ai-feature';
/**
 * Styles
 */
import './style.scss';

export default function BasicStatsPanel( { requestsCount, requireUpgrade }: AIFeatureProps ) {
	let statsMessage = createInterpolateElement(
		__( 'You have <stats /> free requests left.', 'jetpack' ),
		{
			stats: <strong>{ requestsCount }</strong>,
		}
	);

	if ( ! requireUpgrade ) {
		statsMessage = createInterpolateElement(
			__( 'You did <stats /> requests so far!', 'jetpack' ),
			{
				stats: (
					<strong className="jetpack-ai-assistant__stats has-unlimited-requests">
						{ requestsCount }
					</strong>
				),
			}
		);
	}

	return (
		<PanelBody title={ __( 'Basic Stats', 'jetpack' ) } initialOpen={ true }>
			<PanelRow>
				<div className="jetpack-ai-assistant__simple-stats">{ statsMessage }</div>
			</PanelRow>
		</PanelBody>
	);
}
