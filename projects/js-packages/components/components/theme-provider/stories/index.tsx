import { ClipboardButton } from '@wordpress/components';
import Col from '../../layout/col';
import Container from '../../layout/container';
import ThemeProvider, { typography, colors, borders, spacing } from '../index';
import styles from './style.module.scss';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * Get the contrasting color for any hex color
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 *
 * @param   {string} hexcolor - hexcolor value
 * @returns {string}            The contrasting color (black or white)
 */
function getContrast( hexcolor ) {
	// If a leading # is provided, remove it
	if ( hexcolor.slice( 0, 1 ) === '#' ) {
		hexcolor = hexcolor.slice( 1 );
	}

	// If a three-character hexcode, make six-character
	if ( hexcolor.length === 3 ) {
		hexcolor = hexcolor
			.split( '' )
			.map( function ( hex ) {
				return hex + hex;
			} )
			.join( '' );
	}

	// Convert to RGB value
	const r = parseInt( hexcolor.substring( 0, 2 ), 16 );
	const g = parseInt( hexcolor.substring( 2, 4 ), 16 );
	const b = parseInt( hexcolor.substring( 4, 6 ), 16 );

	// Get YIQ ratio
	const yiq = ( r * 299 + g * 587 + b * 114 ) / 1000;

	// Check contrast
	return yiq >= 128 ? 'black' : 'white';
}
export default {
	title: 'JS Packages/Components/Theme Provider',
} as ComponentMeta< typeof ThemeProvider >;

const noop = () => {
	//
};

const Section = ( { title, data, children = null } ) => (
	<div className={ styles.section }>
		<h1 className={ styles.title }>{ title }</h1>
		<Container fluid>
			{ Object.keys( data ).map( key => (
				<Col lg={ 3 } className={ styles.box }>
					<Container fluid horizontalGap={ 2 }>
						<Col className={ styles.key }>{ key }</Col>
						{ children && <Col className={ styles.example }>{ children( data[ key ] ) }</Col> }
						<Col>
							<div className={ styles[ 'value-label' ] }>Value</div>
							<input
								type="text"
								value={ data[ key ] }
								readOnly={ true }
								className={ styles.value }
							/>
						</Col>
					</Container>
				</Col>
			) ) }
		</Container>
	</div>
);

export const Tokens = () => (
	<>
		<Section title="Typography" data={ typography }>
			{ value => <div style={ { fontSize: value } }>Text</div> }
		</Section>
		<Section title="Colors" data={ colors }>
			{ value => (
				<div className={ styles[ 'colors-example' ] } style={ { backgroundColor: value } } />
			) }
		</Section>
		<Section title="Borders" data={ borders } />
		<Section title="Spacing" data={ spacing } />
	</>
);

export const Typographies = args => (
	<div className={ styles[ 'instances-wrapper' ] }>
		{ Object.keys( typography ).map( key => (
			<div className={ styles[ 'font-instance' ] } style={ { fontSize: typography[ key ] } }>
				{ args?.[ 'Text Instance' ] || `${ key } (${ typography[ key ] } )` }

				<ClipboardButton
					variant="tertiary"
					text={ key }
					isSecondary
					onCopy={ noop }
					className={ styles[ 'copy-button' ] }
				>
					Copy
				</ClipboardButton>
			</div>
		) ) }
	</div>
);

Typographies.args = {
	[ 'Text Instance' ]: '',
};

export const Colors = () => (
	<div className={ styles[ 'instances-wrapper' ] }>
		{ Object.keys( colors ).map( key => (
			<div
				className={ styles[ 'color-instance' ] }
				style={ { backgroundColor: colors[ key ], color: getContrast( colors[ key ] ) } }
			>
				{ `${ key } (${ colors[ key ].toUpperCase() } )` }

				<ClipboardButton
					variant="tertiary"
					text={ key }
					isSecondary
					onCopy={ noop }
					className={ styles[ 'copy-button' ] }
					style={ { color: getContrast( colors[ key ] ) } }
				>
					Copy
				</ClipboardButton>
			</div>
		) ) }
	</div>
);

const Template: ComponentStory< typeof ThemeProvider > = args => (
	<ThemeProvider { ...args }>
		<div
			style={ {
				color: 'var( --jp-white )',
				backgroundColor: 'var( --jp-pink )',
				fontSize: 'var( --font-title-small )',
				padding: 'var( --spacing-base ) calc( var( --spacing-base ) * 2 )',
				borderRadius: 'var( --jp-border-radius )',
			} }
		>
			Pink Jetpack Show
		</div>
	</ThemeProvider>
);
export const BasicUsage = Template.bind( {} );
