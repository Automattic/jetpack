import BotParser from './parsers/bot';
import ClientParser, { ClientResult } from './parsers/client';
import BrowserParser from './parsers/client/browser';
import DeviceParser, { DeviceResult } from './parsers/device';
import OperatingSystemParser, { Result as OperatingSystemResult } from './parsers/operating-system';
import VendorFragmentParser from './parsers/vendor-fragment';
import { GenericDeviceResult } from './typings/device';
import { userAgentParser } from './utils/user-agent';
import { versionCompare } from './utils/version-compare';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace DeviceDetector {
	export interface DeviceDetectorResult {
		client: ClientResult;
		device: DeviceResult;
		os: OperatingSystemResult;
		bot: BotParser.DeviceDetectorBotResult;
	}

	export interface DeviceDetectorOptions {
		skipBotDetection: boolean;
		versionTruncation: 0 | 1 | 2 | 3 | null;
	}
}

class DeviceDetector {
	private clientParser: ClientParser;
	private deviceParser: DeviceParser;
	private operatingSystemParser: OperatingSystemParser;
	private vendorFragmentParser: VendorFragmentParser;
	private botParser: BotParser;

	// Default options
	private readonly options: DeviceDetector.DeviceDetectorOptions = {
		skipBotDetection: false,
		versionTruncation: 1,
	};

	constructor( options?: Partial< DeviceDetector.DeviceDetectorOptions > ) {
		this.options = { ...this.options, ...options };
		this.clientParser = new ClientParser( this.options );
		this.deviceParser = new DeviceParser();
		this.operatingSystemParser = new OperatingSystemParser( this.options );
		this.vendorFragmentParser = new VendorFragmentParser();
		this.botParser = new BotParser();
	}

	public parse = ( userAgent: string ): DeviceDetector.DeviceDetectorResult => {
		const result: DeviceDetector.DeviceDetectorResult = {
			client: this.clientParser.parse( userAgent ),
			os: this.operatingSystemParser.parse( userAgent ),
			device: this.deviceParser.parse( userAgent ),
			bot: this.options.skipBotDetection ? null : this.botParser.parse( userAgent ),
		};

		const osName = result.os?.name;
		const osVersion = result.os?.version;
		const osFamily = OperatingSystemParser.getOsFamily( osName || '' );

		if ( ! result.device?.brand ) {
			const brand = this.vendorFragmentParser.parse( userAgent );

			if ( brand ) {
				if ( ! result.device ) {
					result.device = this.createDeviceObject();
				}
				result.device.brand = brand;
			}
		}

		/**
		 * Assume all devices running iOS / Mac OS are from Apple
		 */
		if (
			! result.device?.brand &&
			[ 'Apple TV', 'watchOS', 'iOS', 'Mac' ].includes( osName || '' )
		) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.brand = 'Apple';
		}

		/**
		 * Chrome on Android passes the device type based on the keyword 'Mobile'
		 * If it is present the device should be a smartphone, otherwise it's a tablet
		 * See https://developer.chrome.com/multidevice/user-agent#chrome_for_android_user_agent
		 * Note: We do not check for browser (family) here, as there might be mobile apps using Chrome, that won't have
		 * a detected browser, but can still be detected. So we check the useragent for Chrome instead.
		 */
		if (
			! result.device?.type &&
			osFamily === 'Android' &&
			userAgentParser( 'Chrome/[\\.0-9]*', userAgent )
		) {
			if ( userAgentParser( 'Chrome/[.0-9]* (?:Mobile|eliboM)', userAgent ) ) {
				if ( ! result.device ) {
					result.device = this.createDeviceObject();
				}

				result.device.type = 'smartphone';
			} else if ( userAgentParser( 'Chrome/[.0-9]* (?!Mobile)', userAgent ) ) {
				if ( ! result.device ) {
					result.device = this.createDeviceObject();
				}

				result.device.type = 'tablet';
			}
		}

		/**
		 * Some user agents simply contain the fragment 'Android; Tablet;' or 'Opera Tablet', so we assume those devices are tablets
		 */
		if (
			( ! result.device?.type && this.hasAndroidTabletFragment( userAgent ) ) ||
			userAgentParser( 'Opera Tablet', userAgent )
		) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'tablet';
		}

		/**
		 * Some user agents simply contain the fragment 'Android; Mobile;', so we assume those devices are smartphones
		 */
		if ( ! result.device?.type && this.hasAndroidMobileFragment( userAgent ) ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'smartphone';
		}

		/**
		 * Android up to 3.0 was designed for smartphones only. But as 3.0, which was tablet only, was published
		 * too late, there were a bunch of tablets running with 2.x
		 * With 4.0 the two trees were merged and it is for smartphones and tablets
		 *
		 * So were are expecting that all devices running Android < 2 are smartphones
		 * Devices running Android 3.X are tablets. Device type of Android 2.X and 4.X+ are unknown
		 */
		if ( ! result.device?.type && osName === 'Android' && osVersion !== '' ) {
			if ( versionCompare( osVersion, '2.0' ) === -1 ) {
				if ( ! result.device ) {
					result.device = this.createDeviceObject();
				}

				result.device.type = 'smartphone';
			} else if (
				versionCompare( osVersion, '3.0' ) >= 0 &&
				versionCompare( osVersion, '4.0' ) === -1
			) {
				if ( ! result.device ) {
					result.device = this.createDeviceObject();
				}

				result.device.type = 'tablet';
			}
		}

		/**
		 * All detected feature phones running android are more likely smartphones
		 */
		if ( ( result.device?.type as string ) === 'feature phone' && osFamily === 'Android' ) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			result.device!.type = 'smartphone';
		}

		/**
		 * According to http://msdn.microsoft.com/en-us/library/ie/hh920767(v=vs.85).aspx
		 * Internet Explorer 10 introduces the "Touch" UA string token. If this token is present at the end of the
		 * UA string, the computer has touch capability, and is running Windows 8 (or later).
		 * This UA string will be transmitted on a touch-enabled system running Windows 8 (RT)
		 *
		 * As most touch enabled devices are tablets and only a smaller part are desktops/notebooks we assume that
		 * all Windows 8 touch devices are tablets.
		 */
		if (
			! result.device?.type &&
			this.isToucheEnabled( userAgent ) &&
			( osName === 'Windows RT' ||
				( osName === 'Windows' && versionCompare( osVersion, '8.0' ) >= 0 ) )
		) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'tablet';
		}

		/**
		 * All devices running Opera TV Store are assumed to be televisions
		 */
		if ( userAgentParser( 'Opera TV Store', userAgent ) ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'television';
		}

		/**
		 * All devices running Tizen TV or SmartTV are assumed to be televisions
		 */
		if ( userAgentParser( 'SmartTV|Tizen.+ TV .+$', userAgent ) ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'television';
		}

		/**
		 * Devices running Kylo or Espital TV Browsers are assumed to be televisions
		 */
		if (
			! result.device?.type &&
			[ 'Kylo', 'Espial TV Browser' ].includes( result.client?.name || '' )
		) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'television';
		}

		/**
		 * Set device type to desktop if string ua contains desktop
		 */
		const hasDesktop =
			'desktop' !== result.device?.type &&
			null !== userAgentParser( 'Desktop', userAgent ) &&
			this.hasDesktopFragment( userAgent );
		if ( hasDesktop ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'desktop';
		}

		// set device type to desktop for all devices running a desktop os that were not detected as an other device type
		if ( ! result.device?.type && this.isDesktop( result, osFamily ) ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'desktop';
		}

		return result;
	};

	private hasAndroidMobileFragment = ( userAgent: string ) => {
		return userAgentParser( 'Android( [.0-9]+)?; Mobile;', userAgent );
	};

	private hasAndroidTabletFragment = ( userAgent: string ) => {
		return userAgentParser( 'Android( [.0-9]+)?; Tablet;', userAgent );
	};

	private hasDesktopFragment = ( userAgent: string ) => {
		return userAgentParser( 'Desktop (x(?:32|64)|WOW64);', userAgent );
	};

	private isDesktop = (
		result: DeviceDetector.DeviceDetectorResult,
		osFamily: string
	): boolean => {
		if ( ! result.os ) {
			return false;
		}

		// Check for browsers available for mobile devices only
		if ( this.usesMobileBrowser( result.client ) ) {
			return false;
		}

		return OperatingSystemParser.getDesktopOsArray().includes( osFamily );
	};

	private usesMobileBrowser = ( client: DeviceDetector.DeviceDetectorResult[ 'client' ] ) => {
		if ( ! client ) {
			return false;
		}

		return client?.type === 'browser' && BrowserParser.isMobileOnlyBrowser( client?.name );
	};

	private isToucheEnabled = ( userAgent: string ) => {
		return userAgentParser( 'Touch', userAgent );
	};

	private createDeviceObject = (): GenericDeviceResult => ( {
		type: '',
		brand: '',
		model: '',
	} );
}

export default DeviceDetector;
