import { JetpackLogo } from '@automattic/jetpack-components';
import { __experimentalHStack as HStack, Icon } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __, sprintf } from '@wordpress/i18n';
import { commentAuthorAvatar, globe, wordpress } from '@wordpress/icons';
import type { ActivityActorDetails } from './types';
import type { ReactNode } from 'react';
import './activity-actor.scss';

const ICON_SIZE = 24;

/**
 * Build the short "via <MCP client>" string shown under the actor name
 * when the originating agent was an MCP client.
 *
 * @param actor - The actor details for the current log row.
 * @return The formatted string, or null if the actor isn't an MCP agent.
 */
function getMcpIndicator( actor?: ActivityActorDetails ): string | null {
	if ( ! actor?.isMcpAgent ) {
		return null;
	}
	return actor.mcpClient
		? sprintf(
				/* translators: %s: MCP client name and version */
				__( 'via %s (MCP)', 'jetpack-activity-log' ),
				actor.mcpClient
		  )
		: __( 'via MCP', 'jetpack-activity-log' );
}

/**
 * Decide the icon + label for a given actor. Matches Calypso's mapping so
 * WordPress / Jetpack / Server / Happiness Engineer / avatar branches render
 * the same thing users already recognize.
 *
 * @param actor - The actor details for the current log row.
 * @return Icon element (or null) + display label.
 */
function getActorPresentation( actor?: ActivityActorDetails ): { icon: ReactNode; label: string } {
	// tsgo types `__()`'s return as a branded `TransformedText<…>` rather
	// than plain `string`; annotating the variable keeps later
	// `actorName = name || actorName` assignments widened to `string`.
	let actorName: string = __( 'Unknown', 'jetpack-activity-log' );

	if ( ! actor ) {
		return { icon: null, label: actorName };
	}

	const { actorName: name, actorType, actorAvatarUrl } = actor;
	actorName = name || actorName;

	switch ( actorType ) {
		case 'Application':
			if ( name === 'WordPress' ) {
				return {
					icon: (
						<Icon
							className="site-activity-logs__actor-icon-wordpress"
							icon={ wordpress }
							size={ ICON_SIZE }
						/>
					),
					label: name,
				};
			}
			if ( name === 'Jetpack' || name === 'Jetpack Boost' ) {
				return {
					icon: (
						<JetpackLogo
							className="site-activity-logs__actor-icon-jetpack"
							showText={ false }
							height={ ICON_SIZE }
						/>
					),
					label: name,
				};
			}
			break;
		case 'Person':
			if ( name === 'Server' ) {
				return {
					icon: (
						<Icon
							className="site-activity-logs__actor-icon-server"
							icon={ globe }
							size={ ICON_SIZE }
						/>
					),
					label: __( 'Server', 'jetpack-activity-log' ),
				};
			}
			break;
		case 'Happiness Engineer':
			return {
				icon: (
					<JetpackLogo
						className="site-activity-logs__actor-icon-jetpack"
						showText={ false }
						height={ ICON_SIZE }
					/>
				),
				label: __( 'Happiness Engineer', 'jetpack-activity-log' ),
			};
	}

	if ( actorAvatarUrl ) {
		return {
			icon: (
				<img
					className="site-activity-logs__actor-icon-avatar"
					src={ actorAvatarUrl }
					alt={ actorName }
					width={ ICON_SIZE }
					height={ ICON_SIZE }
				/>
			),
			label: actorName,
		};
	}

	return {
		icon: (
			<Icon
				className="site-activity-logs__actor-icon-default"
				icon={ commentAuthorAvatar }
				size={ ICON_SIZE }
			/>
		),
		label: actorName,
	};
}

/**
 * DataViews cell renderer for the "User" column. Shows the actor's avatar
 * (or a branded icon for system actors) next to their name.
 *
 * @param props       - Component props.
 * @param props.actor - Actor details for the current log row.
 * @return The actor cell.
 */
export function ActivityActor( { actor }: { actor?: ActivityActorDetails } ) {
	const { icon, label } = getActorPresentation( actor );
	const mcpIndicator = getMcpIndicator( actor );

	return (
		<HStack spacing="2" alignment="left" className="site-activity-logs__actor">
			{ icon }
			<span>
				{ label }
				{ mcpIndicator && <span className="site-activity-logs__actor-mcp">{ mcpIndicator }</span> }
			</span>
		</HStack>
	);
}
