/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { getAttributesFromEmbedCode } from '../utils';

const inlineEmbedCode = '<!-- Calendly inline widget begin -->' +
	'<div class="calendly-inline-widget" data-url="https://calendly.com/scruffian/usability-test" style="min-width:320px;height:630px;"></div>' +
	'<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js"></script>' +
	'<!-- Calendly inline widget end -->';

const widgetEmbedCode = '<!-- Calendly badge widget begin -->' +
	'<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">' +
	'<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript"></script>' +
	'<script type="text/javascript">Calendly.initBadgeWidget({ url: \'https://calendly.com/scruffian/usability-test\', text: \'Schedule time with me\', color: \'#00a2ff\', textColor: \'#ffffff\', branding: true });</script>' +
	'<!-- Calendly badge widget end -->';

const textEmbedCode = '<!-- Calendly link widget begin -->' +
	'<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">' +
	'<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript"></script>' +
	'<a href="" onclick="Calendly.initPopupWidget({url: \'https://calendly.com/scruffian/usability-test\'});return false;">Schedule time with me</a>' +
	'<!-- Calendly link widget end -->';

const customInlineEmbedCode = '<!-- Calendly inline widget begin -->' +
	'<div class="calendly-inline-widget" data-url="https://calendly.com/scruffian/usability-test?hide_event_type_details=1&background_color=691414&text_color=2051a3&primary_color=1d6e9c" style="min-width:320px;height:630px;"></div>' +
	'<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js"></script>' +
	'<!-- Calendly inline widget end -->';

const customWidgetEmbedCode = '<!-- Calendly badge widget begin -->' +
	'<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">' +
	'<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript"></script>' +
	'<script type="text/javascript">Calendly.initBadgeWidget({ url: \'https://calendly.com/scruffian/usability-test?background_color=c51414&text_color=2563ca&primary_color=1d73a4\', text: \'Schedule some time with me\', color: \'#000609\', textColor: \'#b50000\', branding: true });</script>' +
	'<!-- Calendly badge widget end -->';

const customTextEmbedCode = '<!-- Calendly link widget begin -->' +
	'<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">' +
	'<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript"></script>' +
	'<a href="" onclick="Calendly.initPopupWidget({url: \'https://calendly.com/scruffian/usability-test?background_color=e32424&text_color=2a74ef&primary_color=0e425f\'});return false;">Schedule some time with me</a>' +
	'<!-- Calendly link widget end -->';

describe( 'getAttributesFromEmbedCode', () => {
	test( 'URL with http', () => {
		expect(
			getAttributesFromEmbedCode( 'https://calendly.com/scruffian/usability-test' )
		).toEqual(
			{
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );
	
	test( 'URL without http', () => {
		expect(
			getAttributesFromEmbedCode( 'calendly.com/scruffian/usability-test' )
		).toEqual(
			{
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'URL with query string', () => {
		expect(
			getAttributesFromEmbedCode( '//calendly.com/scruffian/usability-test?month=2019-12' )
		).toEqual(
			{
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Inline embed code', () => {
		expect(
			getAttributesFromEmbedCode( inlineEmbedCode )
		).toEqual(
			{
				"style": "inline",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Widget embed code', () => {
		expect(
			getAttributesFromEmbedCode( widgetEmbedCode )
		).toEqual(
			{
				"style": "link",
				"submitButtonText": "Schedule time with me",
				"customBackgroundButtonColor": "#00a2ff",
				"customTextButtonColor": "#ffffff",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Text embed code', () => {
		expect(
			getAttributesFromEmbedCode( textEmbedCode )
		).toEqual(
			{
				"style": "link",
				"submitButtonText": "Schedule time with me",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Customised inline embed code', () => {
		expect(
			getAttributesFromEmbedCode( customInlineEmbedCode )
		).toEqual(
			{
				"backgroundColor": "691414",
				"hideEventTypeDetails": "1",
				"primaryColor": "1d6e9c",
				"style": "inline",
				"textColor": "2051a3",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Customised widget embed code', () => {
		expect(
			getAttributesFromEmbedCode( customWidgetEmbedCode )
		).toEqual(
			{
				"backgroundColor": "c51414",
				"customBackgroundButtonColor": "#000609",
				"customTextButtonColor": "#b50000",
				"primaryColor": "1d73a4",
				"style": "link",
				"submitButtonText": "Schedule some time with me",
				"textColor": "2563ca",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} );

	test( 'Customised text embed code', () => {
		expect(
			getAttributesFromEmbedCode( customTextEmbedCode )
		).toEqual(
			{
				"backgroundColor": "e32424",
				"primaryColor": "0e425f",
				"style": "link",
				"submitButtonText": "Schedule some time with me",
				"textColor": "2a74ef",
				"url": "https://calendly.com/scruffian/usability-test"
			}
		);
	} )
} );
