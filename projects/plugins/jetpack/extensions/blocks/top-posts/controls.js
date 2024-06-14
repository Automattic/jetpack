import {
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

export function TopPostsInspectorControls( {
	attributes,
	setAttributes,
	postTypesData,
	toggleAttributes,
	setToggleAttributes,
} ) {
	const { displayAuthor, displayContext, displayDate, displayThumbnail, period, postsToShow } =
		attributes;

	const [ showErrorMessage, setShowErrorMessage ] = useState( false );

	if ( ! postTypesData ) {
		return;
	}

	const handleToggleChange = toggleId => isChecked => {
		const updatedAttributes = {
			...toggleAttributes,
			[ toggleId ]: isChecked,
		};

		// Require at least one type to be selected.
		if ( Object.values( updatedAttributes ).every( value => value === false ) ) {
			return setShowErrorMessage( true );
		}

		setToggleAttributes( updatedAttributes );
		setAttributes( { postTypes: updatedAttributes } );
		setShowErrorMessage( false );
	};

	const periodOptions = [
		{ label: __( 'Last 24 hours', 'jetpack' ), value: '1' },
		{ label: __( 'Last 48 hours', 'jetpack' ), value: '2' },
		{ label: __( 'Last 7 days', 'jetpack' ), value: '7' },
		{ label: __( 'Last 30 days', 'jetpack' ), value: '30' },
		{ label: __( 'Last 90 days', 'jetpack' ), value: '90' },
		{ label: __( 'Last year', 'jetpack' ), value: '365' },
		{ label: __( 'All-time', 'jetpack' ), value: 'all-time' },
	];

	return (
		<>
			<PanelBody title={ __( 'Block settings', 'jetpack' ) }>
				<RangeControl
					label={ __( 'Number of items', 'jetpack' ) }
					value={ postsToShow }
					onChange={ value => setAttributes( { postsToShow: Math.min( value, 10 ) } ) }
					min={ 1 }
					max={ 10 }
				/>
				<SelectControl
					label={ __( 'Stats period', 'jetpack' ) }
					value={ period }
					onChange={ value => setAttributes( { period: value } ) }
					options={ periodOptions }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Items to display', 'jetpack' ) }>
				{ postTypesData.map( toggle => (
					<ToggleControl
						key={ toggle.id }
						label={ sprintf(
							/* translators: %s: Content type (eg. post/page). */
							__( 'Display %s', 'jetpack' ),
							toggle.label.toLowerCase()
						) }
						checked={ toggleAttributes[ toggle.id ] || false }
						onChange={ handleToggleChange( toggle.id ) }
					/>
				) ) }
				{ showErrorMessage && (
					<Notice className="jetpack-top-posts__error" status="error" isDismissible={ false }>
						{ __( 'At least one item must be selected.', 'jetpack' ) }
					</Notice>
				) }
			</PanelBody>
			<PanelBody title={ __( 'Metadata settings', 'jetpack' ) }>
				<ToggleControl
					label={ __( 'Display date', 'jetpack' ) }
					checked={ displayDate }
					onChange={ value => setAttributes( { displayDate: value } ) }
				/>
				<ToggleControl
					label={ __( 'Display author', 'jetpack' ) }
					checked={ displayAuthor }
					onChange={ value => setAttributes( { displayAuthor: value } ) }
				/>
				<ToggleControl
					label={ __( 'Display context', 'jetpack' ) }
					checked={ displayContext }
					onChange={ value => setAttributes( { displayContext: value } ) }
				/>
				<ToggleControl
					label={ __( 'Display thumbnail', 'jetpack' ) }
					checked={ displayThumbnail }
					onChange={ value => setAttributes( { displayThumbnail: value } ) }
				/>
			</PanelBody>
		</>
	);
}

export function TopPostsBlockControls( { attributes, setAttributes } ) {
	const { layout } = attributes;
	const layoutControls = [
		{
			icon: 'grid-view',
			title: __( 'Grid view', 'jetpack' ),
			onClick: () => setAttributes( { layout: 'grid' } ),
			isActive: layout === 'grid',
		},
		{
			icon: 'list-view',
			title: __( 'List view', 'jetpack' ),
			onClick: () => setAttributes( { layout: 'list' } ),
			isActive: layout === 'list',
		},
	];

	return <ToolbarGroup controls={ layoutControls } />;
}
