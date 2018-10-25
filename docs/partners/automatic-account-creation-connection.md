# Automatic WordPress.com Account Creation and Connection

As of mid-October 2018, when a hosting partner provisions a site via `https://public-api.wordpress.com/rest/v1.3/jpphp/provision`, whether by a direct API call or via the `partner-provision.sh` shell script, there is logic in the API that *may* greatly simplify the provisioning and connection process.

## Automatic account creation pre-requisites

There are two prerequisites which must be met in order for a WordPress.com account to be provisioned for a user and for the site to be automatically connected:

- The hosting partner must be whitelisted.
- There must not be an existing WordPress.com account with the same email address as the user that the site is being provisioned for.
  - This is based off of the email address for the user's account on the WordPress installation at the hosting partner.

## How it works

When a partner makes a request to the API to provision a site, the API will first check that the above prerequisites are met. That being the case, the API will continue with the following:

### Create a WordPress.com account

Based on the email address that is used by the user on the self-hosted WordPress installation, the API will attempt to create a WordPress.com account that:

- Has an automatically generated username based off of the email address
- Has an automatically generated password

I'd like to point out that both of these values are automatically generated. This brings up a couple of things to consider when supporting these users. These topics will be covered below in [Support Considerations](#support-considerations).

### Connecting the site

Once the new WordPress.com account is created, the API will then attempt to:

- Generate a token that is used to sign communication between the self-hosted WordPress site and WordPress.com.
  - This token is specifically for requests that are signed for this user. By this point, there should already be a blog level token that has been generated and stored on both WordPress.com and the self-hosted WordPress site
- Make a request from WordPress.com to the self-hosted WordPress site in order to set the token.

## Expected return

If either of the above steps fails, then the API will attempt to continue provisioning disregard the automatically created account. If the API call succeeds, then the expected response would be similar to this:

```json
{
  "success": true,
  "auth_required": false,
  "next_url": "http://example.com"
}
```

The `next_url` value in this case would typically be a link for the user to login via [Secure Sign On](https://jetpack.com/support/sso/). But, since the `auth_required` value is `false`, then the host could choose to ignore the `next_url`.

## Support considerations

**What happens if the user does not like the username that was automatically generated?** The user should be able to go to [WordPress.com](https://wordpress.com/me/account) and [change their username](https://en.support.wordpress.com/change-your-username/).

**How does the user log in to their WordPress.com account if they don't know their password?** The user should be able to log in by:

- Going to [https://wordpress.com/log-in](https://wordpress.com/log-in)
- Clicking "Email me a login link"
- Entering their email address
- Clicking the log in link that was just emailed

**What happens if the user does have a WordPress.com account with a different email address?** The user should be able to transfer the plan and ownership over to another account. Information for that functionality can be found at [https://jetpack.com/support/transfer-your-jetpack-connection-or-plan-to-another-user/](https://jetpack.com/support/transfer-your-jetpack-connection-or-plan-to-another-user/).
