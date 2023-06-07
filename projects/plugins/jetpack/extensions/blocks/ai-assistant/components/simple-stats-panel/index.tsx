/**
 * External dependencies
 */
import { PanelBody, PanelRow, Button } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import { AIFeatureProps } from '../../hooks/use-ai-feature';
/**
 * Styles
 */
import './style.scss';

export default function BasicStatsPanel( {
	hasFeature,
	requestsCount,
	requestsLimit = 20,
}: AIFeatureProps ) {
	const [ isRedirecting, setIsRedirecting ] = useState( false );
	const requestsLeft = Math.max( 0, requestsLimit - requestsCount );
	const limitReached = requestsLeft === 0;

	let statsMessage = createInterpolateElement(
		__( 'You have <stats /> free requests left. Upgrade to get unlimited requests.', 'jetpack' ),
		{
			stats: (
				<strong
					className={ `jetpack-ai-assistant__stats${ limitReached ? ' was-limit-achieved' : '' }` }
				>
					{ requestsLeft }
				</strong>
			),
		}
	);

	if ( hasFeature ) {
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

	const checkoutUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/add-jetpack-ai`;

	return (
		<PanelBody title={ __( 'Stats', 'jetpack' ) } initialOpen={ true }>
			<PanelRow>
				<div className="jetpack-ai-assistant__simple-stats">{ statsMessage }</div>
			</PanelRow>

			{ ! hasFeature && (
				<PanelRow>
					<Button
						href={ checkoutUrl }
						onClick={ () => setIsRedirecting( true ) }
						target="_top"
						className="jetpack-ai-assistant__upgrade-button"
						isBusy={ isRedirecting }
					>
						{ __( 'Upgrade', 'jetpack' ) }
					</Button>
				</PanelRow>
			) }
		</PanelBody>
	);
}
