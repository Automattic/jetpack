/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { Button as WPButton } from '@wordpress/components';

export const Button = styled( WPButton )`
	border-radius: 4px;
	font-weight: 600;
	line-height: 18px;
	text-align: center;
	min-height: 40px;
	display: block;
	font-size: ${ ( { size } ) => {
		switch ( size ) {
			case 'small':
				return '10px';
			case 'medium':
				return '14px';
			case 'large':
				return '18px';
		}
	} };
`;

export const Error = styled.p`
	color: var( --jp-red );
	line-height: 25px;
	padding-left: 25px;
	background: url( 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIwQzE2LjQxODMgMjAgMjAgMTYuNDE4MyAyMCAxMkMyMCA3LjU4MTcyIDE2LjQxODMgNCAxMiA0QzcuNTgxNzIgNCA0IDcuNTgxNzIgNCAxMkM0IDE2LjQxODMgNy41ODE3MiAyMCAxMiAyMFoiIHN0cm9rZT0iI0Q2MzYzOSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTEzIDdIMTFWMTNIMTNWN1oiIGZpbGw9IiNENjM2MzkiLz4KPHBhdGggZD0iTTEzIDE1SDExVjE3SDEzVjE1WiIgZmlsbD0iI0Q2MzYzOSIvPgo8L3N2Zz4K' )
		no-repeat 0 0;
`;
