import { getThreatType, Threat } from '@automattic/jetpack-scan';
import { View, FieldType } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useContext, useMemo } from 'react';
import Badge from '../badge';
import ThreatFixerButton from '../threat-fixer-button';
import ThreatSeverityBadge from '../threat-severity-badge';
import {
	THREAT_FIELD_AUTO_FIX,
	THREAT_FIELD_FIRST_DETECTED,
	THREAT_FIELD_FIXED_ON,
	THREAT_FIELD_SEVERITY,
	THREAT_FIELD_STATUS,
	THREAT_FIELD_DESCRIPTION,
	THREAT_FIELD_EXTENSION,
	THREAT_FIELD_ICON,
	THREAT_FIELD_PLUGIN,
	THREAT_FIELD_SIGNATURE,
	THREAT_FIELD_THEME,
	THREAT_FIELD_TITLE,
	THREAT_FIELD_TYPE,
	THREAT_ICONS,
	THREAT_STATUSES,
	THREAT_TYPES,
	THREAT_ACTION_FIX,
} from './constants';
import { ThreatsDataViewsContext } from './context';
import styles from './styles.module.scss';
import { ControlledThreatField } from './types';
import { getFilterValues } from './utils';

/**
 * Hook to manage the visibility of fields based on the current view configuration.
 *
 * @return {object} An object containing the controlFields function.
 */
export default function useControlledFields(): {
	fields: ControlledThreatField[];
	onChangeView: ( view: View ) => void;
} {
	const {
		actionCallbacks,
		data,
		supportedFields,
		view,
		setView,
		forceShowFields,
		setForceShowFields,
	} = useContext( ThreatsDataViewsContext );

	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {object[]} themes     - List of unique themes included in the threats data.
	 * @member {object[]} plugins    - plugins included in the threats data.
	 * @member {object[]} signatures - List of unique threat signatures.
	 */
	const {
		themes,
		plugins,
		signatures,
	}: {
		themes: { value: string; label: string }[];
		plugins: { value: string; label: string }[];
		signatures: { value: string; label: string }[];
	} = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				// Extensions (Themes and Plugins)
				if ( threat.extension ) {
					switch ( threat.extension.type ) {
						case 'themes':
							if ( ! acc.themes.find( ( { value } ) => value === threat.extension.slug ) ) {
								acc.themes.push( { value: threat.extension.slug, label: threat.extension.name } );
							}
							break;
						case 'plugins':
							if ( ! acc.plugins.find( ( { value } ) => value === threat.extension.slug ) ) {
								acc.plugins.push( { value: threat.extension.slug, label: threat.extension.name } );
							}
							break;
						default:
							break;
					}
				}

				// Signatures
				if ( threat.signature ) {
					if ( ! acc.signatures.find( ( { value } ) => value === threat.signature ) ) {
						acc.signatures.push( { value: threat.signature, label: threat.signature } );
					}
				}

				return acc;
			},
			{
				themes: [],
				plugins: [],
				signatures: [],
			}
		);
	}, [ data ] );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-object
	 */
	const fields: ControlledThreatField[] = useMemo( () => {
		return [
			{
				id: THREAT_FIELD_TITLE,
				label: __( 'Threat', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__title }>
						{ view.type === 'table' && (
							<Icon icon={ THREAT_ICONS[ getThreatType( item ) ] } size={ 18 } />
						) }
						<span>{ item.title }</span>
					</div>
				),
			},
			{
				id: THREAT_FIELD_DESCRIPTION,
				label: __( 'Description', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__description }>{ item.description }</div>
				),
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack-components' ),
				views: [ 'list' ],
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item );
				},
				render( { item }: { item: Threat } ) {
					return (
						<div className={ styles.threat__media }>
							<Icon icon={ THREAT_ICONS[ getThreatType( item ) ] } size={ 20 } />
						</div>
					);
				},
			},
			{
				id: THREAT_FIELD_STATUS,
				label: __( 'Status', 'jetpack-components' ),
				elements: THREAT_STATUSES,
				enableHiding: ( () => {
					const statusFilters = getFilterValues( view, THREAT_FIELD_STATUS );
					return ! (
						! statusFilters.length ||
						statusFilters.includes( 'fixed' ) ||
						statusFilters.includes( 'ignored' )
					);
				} )(),
				insertAfter: THREAT_FIELD_SEVERITY,
				getValue( { item }: { item: Threat } ) {
					if ( ! item.status ) {
						return 'current';
					}
					return (
						THREAT_STATUSES.find( ( { value } ) => value === item.status )?.value ?? item.status
					);
				},
				render( { item }: { item: Threat } ) {
					const status = item.status
						? THREAT_STATUSES.find( ( { value } ) => value === item.status )
						: { variant: 'warning' as const, label: __( 'Active', 'jetpack-components' ) };

					const labelledStatus = sprintf(
						/** translators: placeholder is the threat status, i.e. "Active" or "Fixed". */
						__( 'Status: %s', 'jetpack-components' ),
						status.label
					);

					return view.type === 'table' ? (
						<Badge variant={ status?.variant }>{ status.label }</Badge>
					) : (
						labelledStatus
					);
				},
				isDefault: ( v: View ) => {
					const statusFilters = getFilterValues( v, THREAT_FIELD_STATUS );
					return (
						! statusFilters.length ||
						statusFilters.includes( 'fixed' ) ||
						statusFilters.includes( 'ignored' )
					);
				},
			},
			{
				id: THREAT_FIELD_SEVERITY,
				label: __( 'Severity', 'jetpack-components' ),
				type: 'integer' as FieldType,
				getValue( { item }: { item: Threat } ) {
					return item.severity ?? 0;
				},
				render( { item }: { item: Threat } ) {
					return (
						<ThreatSeverityBadge severity={ item.severity } inline={ view.type !== 'table' } />
					);
				},
			},
			{
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack-components' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item ) || '';
				},
				render( { item }: { item: Threat } ) {
					const type = getThreatType( item );
					if ( ! type ) {
						return null;
					}

					const label = THREAT_TYPES.find( ( { value } ) => value === type )?.label ?? type;

					const labelledType = sprintf(
						/** translators: placeholder is the threat type, i.e. "Plugin" or "File". */
						__( 'Type: %s', 'jetpack-components' ),
						label,
						0 /* prevent bad minification */
					);

					return view.type === 'table' ? label : labelledType;
				},
			},
			{
				id: THREAT_FIELD_PLUGIN,
				label: __( 'Plugin', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: plugins,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
				render( { item }: { item: Threat } ) {
					return item.extension ? item.extension.name : '';
				},
			},
			{
				id: THREAT_FIELD_THEME,
				label: __( 'Theme', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: themes,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
				render( { item }: { item: Threat } ) {
					return item.extension ? item.extension.name : '';
				},
			},
			{
				id: THREAT_FIELD_EXTENSION,
				label: __( 'Extension', 'jetpack-components' ),
				enableGlobalSearch: true,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
				render( { item }: { item: Threat } ) {
					const extensionName = item.extension ? item.extension.name : '';
					if ( ! extensionName ) {
						return '';
					}
					const labelledExtensionName = sprintf(
						/** translators: placeholder is the extension name, i.e. "Jetpack" or "WooCommerce". */
						__( 'Extension: %s', 'jetpack-components' ),
						extensionName
					);
					return view.type === 'table' ? extensionName : labelledExtensionName;
				},
			},
			{
				id: THREAT_FIELD_SIGNATURE,
				label: __( 'Signature', 'jetpack-components' ),
				elements: signatures,
				enableGlobalSearch: true,
				getValue( { item }: { item: Threat } ) {
					return item.signature || '';
				},
				render( { item }: { item: Threat } ) {
					const signature = item.signature || '';
					if ( ! signature ) {
						return '';
					}
					const labelledSignature = sprintf(
						/** translators: placeholder is the signature name, i.e. "SQL Injection" or "Cross-Site Scripting". */
						__( 'Signature: %s', 'jetpack-components' ),
						signature
					);
					return view.type === 'table' ? signature : labelledSignature;
				},
			},
			{
				id: THREAT_FIELD_FIRST_DETECTED,
				label: __( 'First Detected', 'jetpack-components' ),
				type: 'datetime' as FieldType,
				getValue( { item }: { item: Threat } ) {
					return item.firstDetected ? new Date( item.firstDetected ) : null;
				},
				isDefault: ( v: View ) => {
					const statusFilters = getFilterValues( v, THREAT_FIELD_STATUS );
					return statusFilters.includes( 'fixed' ) || statusFilters.includes( 'ignored' );
				},
				render( { item }: { item: Threat } ) {
					if ( ! item.firstDetected ) {
						return null;
					}

					const formattedDate = dateI18n( 'M j, Y', item.firstDetected, false );
					/** translators: placeholder is a date, i.e. Jan 1, 2000. */
					const labelledDate = sprintf( __( 'Detected: %s', 'jetpack-components' ), formattedDate );

					return view.type === 'table' ? (
						<span className={ styles.threat__firstDetected }>{ formattedDate }</span>
					) : (
						labelledDate
					);
				},
			},
			{
				id: THREAT_FIELD_FIXED_ON,
				label: __( 'Fixed On', 'jetpack-components' ),
				type: 'datetime' as FieldType,
				enableHiding: ! getFilterValues( view, THREAT_FIELD_STATUS ).includes( 'fixed' ),
				insertAfter: THREAT_FIELD_FIRST_DETECTED,
				getValue( { item }: { item: Threat } ) {
					return item.fixedOn ? new Date( item.fixedOn ) : null;
				},
				render( { item }: { item: Threat } ) {
					if ( ! item.fixedOn ) {
						return null;
					}

					const formattedDate = dateI18n( 'M j, Y', item.fixedOn, false );
					/** translators: placeholder is a date, i.e. Jan 1, 2000. */
					const labelledDate = sprintf( __( 'Fixed: %s', 'jetpack-components' ), formattedDate );

					return view.type === 'table' ? (
						<span className={ styles.threat__fixedOn }>{ formattedDate }</span>
					) : (
						labelledDate
					);
				},
				isDefault: ( v: View ) => {
					const statusFilters = getFilterValues( v, THREAT_FIELD_STATUS );
					return statusFilters.includes( 'fixed' );
				},
			},
			{
				id: THREAT_FIELD_AUTO_FIX,
				label: __( 'Auto-fix', 'jetpack-components' ),
				enableHiding: false,
				elements: [
					{
						value: 'yes',
						label: __( 'Yes', 'jetpack-components' ),
					},
					{
						value: 'no',
						label: __( 'No', 'jetpack-components' ),
					},
				],
				views: [ 'table' ],
				getValue( { item }: { item: Threat } ) {
					return item.fixable ? 'yes' : 'no';
				},
				render( { item }: { item: Threat } ) {
					if ( ! item.fixable ) {
						return null;
					}

					return (
						<ThreatFixerButton
							threat={ item }
							onClick={ actionCallbacks[ THREAT_ACTION_FIX ]?.callback }
						/>
					);
				},
				isDefault: ( v: View ) => {
					const statusFilters = getFilterValues( v, THREAT_FIELD_STATUS );
					return ! statusFilters.length || statusFilters.includes( 'current' );
				},
			},
		].filter( field => {
			if ( supportedFields ) {
				return supportedFields.includes( field.id );
			}

			if ( field.views && ! field.views.includes( view.type ) ) {
				return false;
			}

			return true;
		} );
	}, [ plugins, themes, signatures, view, actionCallbacks, supportedFields ] );

	/**
	 * Callback function to update the view state.
	 * Manages the visibility of fields based on the changing view configuration.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#onchangeview-function
	 *
	 * @param {View} oldView - The previous view configuration.
	 * @param {View} newView - The incoming view configuration.
	 *
	 * @return {View} The controlled view configuration.
	 */
	const onChangeView = useCallback(
		( newView: View ) => {
			setView( ( oldView: View ) => {
				console.log( { oldView, newView } );
				const customView = { ...newView };

				for ( const field of fields ) {
					/** @member {bool} wasDefault - True when the field should be shown by default based on the current view config. */
					const wasDefault = field.isDefault ? field.isDefault( oldView ) : false;

					/** @member {bool} newIsDefault - True when the field should be shown by default based on the incoming view config. */
					const isDefault = field.isDefault ? field.isDefault( newView ) : false;

					/** @member {bool} newIsIncluded - True when the field is present in the incoming view config. */
					const isIncluded = newView.fields.includes( field.id );

					/** @member {bool} wasIncluded - True when the field is present in the incoming view config. */
					const wasIncluded = oldView.fields.includes( field.id );

					/** @member {bool} newIsForced - True when the field as been manually included. */
					let isForced = forceShowFields.includes( field.id );

					// Adding a non-default field
					if (
						isIncluded &&
						! isDefault &&
						! wasDefault &&
						! isForced &&
						oldView.type === newView.type
					) {
						isForced = true;
						setForceShowFields( currentFields => {
							return [ ...currentFields, field.id ];
						} );

						// Enforce the order of the fields
						if ( field.insertAfter ) {
							const fromIndex = customView.fields.indexOf( field.id );
							const toIndex = newView.fields.indexOf( field.insertAfter );
							if ( fromIndex !== -1 && toIndex !== -1 ) {
								const element = customView.fields[ fromIndex ];
								customView.fields.splice( fromIndex, 1 );
								customView.fields.splice( toIndex + 1, 0, element );
							}
						}
					}

					// Removing a non-default field
					if (
						! isIncluded &&
						wasIncluded &&
						! isDefault &&
						isForced &&
						oldView.type === newView.type
					) {
						isForced = false;
						setForceShowFields( currentFields => {
							return currentFields.filter( f => f !== field.id );
						} );
					}

					// Remove the field if it should no longer be visible.
					if ( isIncluded && ! isDefault && ! isForced && oldView.type === newView.type ) {
						customView.fields = customView.fields.filter( f => f !== field.id );
					}

					// Insert the field if it should be visible.
					if ( ! isIncluded && ( isDefault || isForced ) && oldView.type === newView.type ) {
						// If specified, insert the field after another...
						if ( field.insertAfter ) {
							const index = customView.fields.indexOf( field.insertAfter );
							if ( index !== -1 ) {
								customView.fields.splice( index + 1, 0, field.id );
								continue;
							}
						}

						// ...otherwise, just add it to the end.
						customView.fields.push( field.id );
					}
				}

				return customView;
			} );
		},
		[ fields, forceShowFields, setForceShowFields, setView ]
	);

	return {
		fields,
		onChangeView,
	};
}
