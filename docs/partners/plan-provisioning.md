# Provisioning and Cancelling Jetpack Plans

In this document, we’ll briefly go over how to provision and cancel Jetpack plans via the shell scripts that ship with Jetpack. If you have any questions or issues, our contact information can be found on the [README.md document](README.md).

## What is Jetpack Start?

Jetpack Start is a collection of scripts that you can run in order to provision and cancel Jetpack plans for your customers. These scripts are packaged with the Jetpack plugin, and are designed for lightweight integration and maximum compatibility across Jetpack versions. The scripts also take care of activating any plan-specific features or activating additional plugin dependencies such as Akismet.

In general, you only need to know about two scripts:

1. `bin/partner-provision.sh` - when the user purchases a plan, or bundle of plans, you’ll run this script to provision a plan
2. `bin/partner-cancel.sh` - when the user cancels their plan, you’ll run this script to cancel the plan on WordPress.com, and you will no longer be billed for this site

A Jetpack-Start-provisioned plan has no expiry or renewal date, which means you (and your customers) won’t have to worry about monthly or yearly renewals.

## How does Jetpack Start work?

Jetpack Start supports provisioning a single plan or bundles of plans (for resellers).

For hosts that are bundling our Jetpack plans with their managed WordPress products, we suggest going the single plan route.

### CLI Arguments Key

Further in this document, you will find a few CLI commands with various arguments. Directly below, you will also find a key to explain what the most common arguments are.

- `partner_id`            : Provided to you when we provision your partner account.
- `partner_secret`        : Provided to you when we provision your partner account.
- `user`                  : The ID, email address, or login of a valid user on the WordPress installation hosted by the partner. See: https://make.wordpress.org/cli/handbook/config/#global-parameters.
- `plan`                  : One of `personal`, `premium`, or `professional`. The partner's account will need to have this type of plan allowed.
- `url`                   : This optional URL value is used to select a specific subsite in a network. See: https://make.wordpress.org/cli/handbook/config/#global-parameters.
- `onboarding`            : This optional value can be set to `1` to enabled an onboarding wizard.
- `partner_tracking_id`   : This optional value allows us to attach specific actions to a specific site on the partner's side. This has proved useful in cases where users had multiple staging sites.
- `home_url`              : This optional value allows overriding the `home` value when registering a site. This has been useful on hosts where the domain is set via a constant.
- `site_url`              : This optional value allows overriding the `siteurl` value when registering a site. This has been useful on hosts where the domain is set via a constant.

### Provisioning a single plan for a given site

We like to think that integrating with Jetpack Start is fairly easy. From beginning to end, the process looks like this:

1. Obtain a Jetpack Partner ID and token, which we will provide to you
2. Ensure Jetpack is installed on the WordPress site:
    - `wp plugin install jetpack`
3. Run the following script with the Jetpack Partner ID and token that were provided to you
    - `sh ./wp-content/plugins/jetpack/bin/partner-provision.sh --partner_id={partner_id} --partner_secret={partner_secret} --user={id_or_email} --plan={plan_slug} [--url=http://example.com]`
    - The script makes a call to our servers to register the site (if necessary) and provision the requested plan and any additional plugins such as VaultPress and Akismet
4. If the script is successful, it will exit with code 0, and a JSON string. If any next steps are required in the browser, the JSON will include a URL to send your user to. E.g
    - `{ success: true, next_url: "http://wordpress.com/start/plans?foo=bar" }`
5. If the script is unsuccessful, it will exit with code 1, and some text describing the error, like this:
    `{ success: false, error_code: "site_inaccessible", error_message: "We couldn't contact your site" }`
6. Any additional products and settings will be installed on the site within a couple of minutes.

### Cancelling a single plan

The process for cancelling a single plan is just as simple as provisioning a plan!

1. Obtain a Jetpack Partner ID and token, which we will provide to you
2. Ensure Jetpack is installed on site
    - `wp plugin install jetpack`
3. Run the following script with the Jetpack Partner ID and token that were provided to you
    - `sh ./wp-content/plugins/jetpack/bin/partner-cancel.sh --partner_id={partner_id} --partner_secret={partner_secret} [--url=http://example.com]`
4. If the script is successful, it will exit with code 0, and a JSON string.
    - `{ success: true }`
5. If the script is unsuccessful, it will exit with code 1, and some text describing the error, like this:
    `{ success: false, error_code: "incorrect_partner_key'", error_message: "Subscriptions can only be cancelled by the oAuth client that created them" }`

Note: If `{ success: false }` is returned, that means that the site no longer had a plan registered on WordPress.com. In this case, retries are not necessary.

### Provisioning a bundle of plans

As a Jetpack Partner, you can sell your customers “bundles” of Jetpack plans. This is useful if your customers are web hosts or agencies who want to distribute Jetpack to their own customers, or generally just want to buy plans in bulk.

The way this works is that you have access to an API to create new “partner keys”. A key is generated for each “bundle”, and distributed to your customers.

Those customers (e.g. hosts or web professionals) then use those keys to provision plans to their WordPress sites.

These generated partner keys can have limits – certain numbers of personal, premium or professional plans. You (the reseller) are responsible for paying Automattic a wholesale rate for any plans generated using these keys, and in turn you can bill your customers at a markup.

When your customers buy a bundle of Jetpack plans, you create a new key by generating a “client_credentials”-granted oauth token. With that token, you can make a request to the jpphp/partner-keys/new API, like this (assumes you have curl and the excellent json-parsing command jq installed):

```bash
# generate token
PARTNER_ID= your partner id
PARTNER_SECRET= your partner secret
API_HOST=public-api.wordpress.com
ACCESS_TOKEN_JSON=$(curl https://$API_HOST/oauth2/token \
  --silent \
  -d "grant_type=client_credentials&client_id=$PARTNER_ID&client_secret=$PARTNER_SECRET&scope=jetpack-partner")

ACCESS_TOKEN=$(echo $ACCESS_TOKEN_JSON | jq -r ".access_token")

# generate partner key
PARTNER_KEY_INFO=$(curl https://$API_HOST/rest/v1.3/jpphp/partner-keys/new \
  --silent \
  --header "authorization: Bearer $ACCESS_TOKEN" \
  -d "name=My%sKey&allowed_premium_plans=100")
```

After running the script above, PARTNER_KEY_INFO should contain a value like this:

```json
{"id": 10, "name":"My%sKey", "allowed_personal_plans":"0", "allowed_premium_plans":"100", "allowed_professional_plans":"0", "notes":null,"client_id":"12345","client_secret":"ab34fd21,,,"}
```

The client_id and client_secret values are the ones you should or your customers should use to license Jetpack plans with the partner-provision.sh script.
