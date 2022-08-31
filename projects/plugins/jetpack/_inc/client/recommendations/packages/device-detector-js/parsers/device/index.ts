import { GenericDeviceResult } from '../../typings/device';
import CameraParser from './cameras';
import CarParser from './cars';
import ConsoleParser from './consoles';
import MobileParser from './mobiles';
import NotebookParser from './notebooks';
import PortableMediaPlayerParser from './portable-media-players';
import TelevisionParser from './televisions';

export type DeviceResult = GenericDeviceResult | null;

const deviceParsers = [
	ConsoleParser,
	CarParser,
	CameraParser,
	TelevisionParser,
	PortableMediaPlayerParser,
	MobileParser,
	NotebookParser,
];

export default class ClientParser {
	public parse = ( userAgent: string ): DeviceResult => {
		for ( const Parser of deviceParsers ) {
			const parser = new Parser();
			const device = parser.parse( userAgent );

			if ( device.type !== '' ) {
				return device;
			}
		}

		return null;
	};
}
