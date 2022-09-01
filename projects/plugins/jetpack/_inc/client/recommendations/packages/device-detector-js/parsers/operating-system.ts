import operatingSystem from '../fixtures/operating-system.json';
import operatingSystems from '../fixtures/oss.json';
import { userAgentParser } from '../utils/user-agent';
import { variableReplacement } from '../utils/variable-replacement';
import { formatVersion } from '../utils/version';

export interface OperatingSystemResult {
	name: string;
	version: string;
}

export type Result = OperatingSystemResult | null;

const desktopOsArray = [
	'AmigaOS',
	'IBM',
	'GNU/Linux',
	'Mac',
	'Unix',
	'Windows',
	'BeOS',
	'Chrome OS',
];
const shortOsNames = operatingSystem.operatingSystem;
const osFamilies = operatingSystem.osFamilies;

export default class OperatingSystemParser {
	public static getDesktopOsArray = (): string[] => desktopOsArray;

	public static getOsFamily = ( osName: string ): string => {
		const osShortName = OperatingSystemParser.getOsShortName( osName );

		for ( const [ osFamily, shortNames ] of Object.entries( osFamilies ) ) {
			if ( shortNames.includes( osShortName ) ) {
				return osFamily;
			}
		}

		return '';
	};

	private static getOsShortName = ( osName: string ): string => {
		for ( const [ shortName, name ] of Object.entries( shortOsNames ) ) {
			if ( name === osName ) {
				return shortName;
			}
		}

		return '';
	};

	public parse = ( userAgent: string ): Result => {
		const result: OperatingSystemResult = {
			name: '',
			version: '',
		};

		for ( const os of operatingSystems ) {
			const match = userAgentParser( os.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.name = variableReplacement( os.name, match );
			result.version = formatVersion( variableReplacement( os.version, match ) );

			if ( result.name === 'lubuntu' ) {
				result.name = 'Lubuntu';
			}

			if ( result.name === 'debian' ) {
				result.name = 'Debian';
			}

			if ( result.name === 'YunOS' ) {
				result.name = 'YunOs';
			}

			return result;
		}

		return null;
	};
}
