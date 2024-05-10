# Social Logos
A repository of all the social logos used on WordPress.com.

Each logo was pulled from the official branding resource of each service. Branding guidelines were adhered to as much as possible.

Some logos include an official alternate version, if it's provided by the guideline resource. Sometimes it is desirable to have a visually consistent row of icons, all enclosed with the same shape. If the guidelines permit it, then an alternate version was created with a 18dp square or 20dp circle.

For example, the Tumblr guidelines state that it's ok to enclose the logo in any shape, so there's an alternate logo with an 18dp square.

Official guideline resources:

- Facebook: https://www.facebookbrand.com
- Twitter: https://about.twitter.com/company/brand-assets
- Instagram: https://www.instagram-brand.com
- LinkedIn: https://brand.linkedin.com
- Google+: https://developers.google.com/+/branding-guidelines and http://gplus-brand.appspot.com
- Pinterest: https://business.pinterest.com/en/brand-guidelines
- Squarespace: http://www.squarespace.com/brand-guidelines/
- reddit: https://www.reddit.com/about/alien/
- Mastodon: https://joinmastodon.org/branding
- Fediverse: https://commons.wikimedia.org/wiki/File:Fediverse_logo_proposal.svg
- Nextdoor: https://about.nextdoor.com/gb/media/
- http://findguidelin.es
- Threads: https://en.wikipedia.org/wiki/File:Threads_(app)_logo.svg
- X: https://about.twitter.com/en/who-we-are/brand-toolkit

## Using the SocialLogo Component in your project:

Note that this component requires [react](https://www.npmjs.com/package/react) to be installed in your project.

SocialLogo renders a single social-logo svg based on an `icon` prop. It takes a size property but defaults to 24px. For greater sharpness, the icons should only be shown at either 18px, 24px, 36px or 48px. 

There's a gallery with all the available icons in https://wpcalypso.wordpress.com/devdocs/design/social-logo.

```
npm install social-logos --save
```
#### Usage

```
import SocialLogo from 'social-logos';
//...
render() {
    return <SocialLogo icon="twitter" size={ 48 } />;
}
```

#### Props

* `icon`: String - the icon name.
* `size`: Number - (default: 24) set the size of the icon.
* `onClick`: Function - (optional) if you need a click callback.

## Notes & Pixel Grid

The icon grid is based on [Gridicons](https://github.com/Automattic/gridicons) and adheres to the same rules. That is to say, the set is designed on a 24px base grid. That means logos will look their sharpest and crispest when SVGs are inserted with 24px width/height, or the icon font is used at `font-size: 24px;`. 

Logos will also scale well to other sizes, like 18px (75% size), or 36px (150% size). Normally, using icon-sets outside of their pixelgrid is a surefire way to get fuzzy icons. This is also true in the case of this logo set, however unlike custom-designed icons, this is almost unavoidable in the case of logos. The problem is, every single logo is designed with its own dimensions. If we are to respect branding guidelines (which we should), no hinting or pixel-tuning is applied to any logo added to this set. Which means even at the base 24px size, logos could appear fuzzy and less than optimal. That is the way of the world, and a tradeoff between flexibility and respecting the original logo design on one hand, and pixel-perfect logos on the other hand. 

So to summarize:

- **Do** use Social Logos at 48px, 36px, 24px, 18px, 12px. Prioritize 24px or above if you can.
- **Try to avoid** using Social logos at 16px, 17px, or any arbitrary pixel-size that's incompatible with the base 24px grid. For example, don't size the icon font in EMs. 

## Generate New Artifacts using Grunt

### Installing

1. Go to http://nodejs.org/ and press "Install". Follow instructions.
2. Open a terminal. Change to your social-logo directory.
3. Type `npm install`

### Running

In the commandline, type `npm run build`. This will clean up, polish, and generate a build folder containing the following:

- A folder called `font`. This folder contains a WOFF2 font file as well as a CSS file with the font file included inline.
- A folder called `php`. This folder contains a PHP file that allows one to retrieve a logo SVG using the `get_social_logo()` function.
- A folder called `react`. This folder contains the minified SocialLogo component as well as an example component.
- A folder called `svg-clean`. This folder contains minimized SVGs of every Social Logo. These SVGs can be used in Figma for mockups.
- A folder called `svg-sprite`. This folder contains an SVG sprite called `social-logos.svg`, which can be referenced using `use`, as well as an example file.

Do remember to update the React components where they are used when you add a new icon.

### Publishing to NPM

- Follow install instructions
- Check in changes if any and follow PR process.
- Bump package version in package.json to the next desired version and add an alpha postfix `1.1.0-alpha.1`
- While testing changes publish using the next tag `npm publish --tag next`
- If changes look good remove postfix in the version `1.1.0`
- Publish using the latest tag `npm publish --tag latest`

## License

Social Logos is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).
