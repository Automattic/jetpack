import MobileParser from './parsers/mobiles';
import OperatingSystemParser from './parsers/operating-system';
import VendorFragmentParser from './parsers/vendor-fragment';
import { userAgentParser } from './utils/user-agent';
import { versionCompare } from './utils/version-compare';
import type { MobileResult } from './parsers/mobiles';
import type { Result as OperatingSystemResult } from './parsers/operating-system';
import type { GenericMobileResult } from './typings/device';

export interface DeviceDetectorResult {
	device: MobileResult;
}

class DeviceDetector {
	private deviceParser: MobileParser;
	private operatingSystemParser: OperatingSystemParser;
	private vendorFragmentParser: VendorFragmentParser;

	constructor() {
		this.deviceParser = new MobileParser();
		this.operatingSystemParser = new OperatingSystemParser();
		this.vendorFragmentParser = new VendorFragmentParser();
	}

	public parse = ( userAgent: string ): DeviceDetectorResult => {
		const os = this.operatingSystemParser.parse( userAgent );

		const result: DeviceDetectorResult = {
			device: this.deviceParser.parse( userAgent ),
		};

		const osName = os?.name;
		const osVersion = os?.version;
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

		if ( ! result.device?.type && this.hasIphoneFragment( userAgent ) ) {
			if ( ! result.device ) {
				result.device = this.createDeviceObject();
			}

			result.device.type = 'smartphone';
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
		if ( ! result.device?.type && this.isDesktop( os, osFamily ) ) {
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

	private hasIphoneFragment = ( userAgent: string ) => {
		return userAgentParser( 'iPhone', userAgent );
	};

	private isDesktop = ( os: OperatingSystemResult, osFamily: string ): boolean => {
		if ( ! os ) {
			return false;
		}

		return OperatingSystemParser.getDesktopOsArray().includes( osFamily );
	};

	private isToucheEnabled = ( userAgent: string ) => {
		return userAgentParser( 'Touch', userAgent );
	};

	private createDeviceObject = (): GenericMobileResult => ( {
		type: '',
		brand: '',
		model: '',
	} );
}

export default DeviceDetector;
