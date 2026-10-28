import { SocialLogo, SocialLogoData } from 'social-logos';
import type { Service } from '../types';
import type { JSX } from 'react';

const ICON_SIZE = 20;

type LogoName = ( typeof SocialLogoData )[ number ][ 'name' ];

// Service IDs whose social logo goes by another name.
const LOGO_NAMES: Record< string, string > = {
	email: 'mail',
	'jetpack-whatsapp': 'whatsapp',
	'press-this': 'wordpress',
	twitter: 'x',
};

/**
 * The social logo for a service, or the generic share icon for services other plugins add.
 *
 * @param id - Service ID.
 * @return Logo name.
 */
export function logoFor( id: string ): LogoName {
	const name = LOGO_NAMES[ id ] ?? id;
	return SocialLogoData.find( logo => logo.name === name )?.name ?? 'share';
}

/**
 * A service's logo, or the icon a custom service was given.
 *
 * @param props         - Props.
 * @param props.service - Service.
 * @return Icon.
 */
export function ServiceIcon( { service }: { service: Service } ): JSX.Element {
	if ( service.custom && service.icon ) {
		return <img src={ service.icon } width={ ICON_SIZE } height={ ICON_SIZE } alt="" />;
	}

	return <SocialLogo icon={ logoFor( service.id ) } size={ ICON_SIZE } />;
}
