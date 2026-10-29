import { __ } from '@wordpress/i18n';
import { Icon, institution, people } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './style.module.scss';
import type { SiteEntityType } from '../../../data/schema-settings-types';
import type { FC } from 'react';

interface Props {
	/** The currently selected site entity. */
	value: SiteEntityType;
	/** Called with the newly selected entity. */
	onChange: ( next: SiteEntityType ) => void;
	disabled?: boolean;
}

// Organization first (the default), Person second — a site is one or the other.
// Each option is a native radio wrapped in a card label, so keyboard and
// screen-reader behavior (arrow-key navigation, single-selection semantics) comes
// from the platform radiogroup rather than a hand-rolled widget.
const OPTIONS: Array< {
	value: SiteEntityType;
	icon: JSX.Element;
	title: string;
	description: string;
} > = [
	{
		value: 'organization',
		icon: institution,
		title: __( 'An organization', 'jetpack-seo' ),
		description: __(
			'A company, brand, publication, or group. The organization is the site’s main entity.',
			'jetpack-seo'
		),
	},
	{
		value: 'person',
		icon: people,
		title: __( 'A person', 'jetpack-seo' ),
		description: __(
			'A personal site, portfolio, or blog that is about you. You are the site’s main entity.',
			'jetpack-seo'
		),
	},
];

/**
 * The site-entity selector: choose whether the site represents an Organization or
 * a Person. This is the site's publisher / main entity, and it decides which set
 * of fields shows below.
 *
 * @param props          - Component props.
 * @param props.value    - The currently selected entity.
 * @param props.onChange - Called with the newly selected entity.
 * @param props.disabled - Whether selection is disabled (e.g. while saving).
 * @return The entity selector.
 */
const LABEL_ID = 'jetpack-seo-site-represents-label';

const EntitySelector: FC< Props > = ( { value, onChange, disabled = false } ) => (
	<Stack direction="column" gap="sm">
		<Text variant="heading-sm" className={ styles.fieldLabel } id={ LABEL_ID }>
			{ __( 'This site represents', 'jetpack-seo' ) }
		</Text>
		{ /* Point the radiogroup at the visible heading so its accessible name has a
		   single source of truth and isn't announced twice. */ }
		<div className={ styles.entityGrid } role="radiogroup" aria-labelledby={ LABEL_ID }>
			{ OPTIONS.map( option => {
				const selected = value === option.value;
				const inputId = `jetpack-seo-site-represents-${ option.value }`;
				return (
					<label
						key={ option.value }
						htmlFor={ inputId }
						className={ clsx( styles.entity, { [ styles.entitySelected ]: selected } ) }
					>
						<input
							id={ inputId }
							type="radio"
							className={ styles.entityRadio }
							name="jetpack-seo-site-represents"
							value={ option.value }
							checked={ selected }
							disabled={ disabled }
							// eslint-disable-next-line react/jsx-no-bind
							onChange={ () => onChange( option.value ) }
						/>
						<span className={ styles.entityIcon } aria-hidden="true">
							<Icon icon={ option.icon } size={ 24 } />
						</span>
						<span className={ styles.entityBody }>
							<Text className={ styles.entityTitle }>{ option.title }</Text>
							<Text variant="body-sm" className={ styles.muted }>
								{ option.description }
							</Text>
						</span>
					</label>
				);
			} ) }
		</div>
	</Stack>
);

export default EntitySelector;
