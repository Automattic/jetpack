/**
 * External dependencies
 */
import { useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

export const SITE_SETTING_DEFAULT = 'Site default';

export type SiteSettingControl< Option extends string > = typeof SITE_SETTING_DEFAULT | Option;

/**
 * Builds a decorator that puts one global site setting under a story control,
 * applying it around the story and restoring the default afterwards.
 */
export function createSiteSettingDecorator< Name extends string, Option extends string >( {
	argName,
	options,
	description,
	apply,
}: {
	argName: Name;
	options: readonly Option[];
	description: string;
	apply: ( option: Option | undefined ) => void;
} ) {
	type Value = SiteSettingControl< Option >;

	const argTypes = {
		[ argName ]: {
			control: 'select',
			options: [ SITE_SETTING_DEFAULT, ...options ],
			description,
		},
	} as { [ K in Name ]: { control: 'select'; options: Value[]; description: string } };

	function SiteSetting( { value, children }: { value: Value | undefined; children: ReactNode } ) {
		const option = value && value !== SITE_SETTING_DEFAULT ? value : undefined;

		// Applied during render: the widget reads the setting while rendering below.
		apply( option );
		// Applied again in the effect: StrictMode replays the cleanup, which would
		// otherwise leave the default in place for the story's later re-renders.
		useEffect( () => {
			apply( option );
			return () => apply( undefined );
		}, [ option ] );

		return <>{ children }</>;
	}

	const decorator: Decorator = ( Story, { args } ) => {
		const value = ( args as Partial< Record< Name, Value > > )[ argName ];

		return (
			<SiteSetting value={ value }>
				{ /* Charts read the setting once per mount, so a change has to remount them. */ }
				<Story key={ value ?? SITE_SETTING_DEFAULT } />
			</SiteSetting>
		);
	};

	return { argTypes, decorator };
}
