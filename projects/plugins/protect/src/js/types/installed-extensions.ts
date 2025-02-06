/**
 * Site's installed plugin data.
 *
 * @see https://developer.wordpress.org/reference/functions/get_plugin_data
 */
export type PluginData = {
	/** Name of the plugin. Should be unique. */
	Name: string;

	/** Plugin URI. */
	PluginURI?: string;

	/** Plugin version. */
	Version?: string;

	/** Plugin description. */
	Description?: string;

	/** Plugin author’s name. */
	Author?: string;

	/** Plugin author’s website address (if set). */
	AuthorURI?: string;

	/** Plugin textdomain. */
	TextDomain?: string;

	/** Plugin’s relative directory path to .mo files. */
	DomainPath?: string;

	/** Whether the plugin can only be activated network-wide. */
	Network?: boolean;

	/** Minimum required version of WordPress. */
	RequiresWP?: string;

	/** Minimum required version of PHP. */
	RequiresPHP?: string;

	/** ID of the plugin for update purposes, should be a URI. */
	UpdateURI?: string;

	/** Comma separated list of dot org plugin slugs. */
	RequiresPlugins?: string;

	/** Title of the plugin and link to the plugin’s site (if set). */
	Title?: string;

	/** Plugin author’s name. */
	AuthorName?: string;
};

/**
 * Site's installed theme data.
 *
 * @see https://developer.wordpress.org/reference/functions/wp_get_themes
 */
export type ThemeData = {
	/** The name of the theme. */
	Name: string;

	/** The URI of the theme’s webpage. */
	ThemeURI: string;

	/** The description of the theme. */
	Description: string;

	/** The theme’s author. */
	Author: string;

	/** The website of the theme author. */
	AuthorURI: string;

	/** The version of the theme. */
	Version: string;

	/** (Optional — used in a child theme) The folder name of the parent theme. */
	Template?: string;

	/** If the theme is published. */
	Status: string;

	/** Tags used to describe the theme. */
	Tags: string[];

	/** The text domain used in the theme for translation purposes. */
	TextDomain: string;

	/** Path to the theme translation files. */
	DomainPath: string;
};
