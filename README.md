# PageSpeed for Slackers

This will run an AWS Lambda function to collection Google PageSpeed information
about a provided url and send it to a Slack channel through an incoming
webhook.

## Setup

Run `npm install` to install the project's dependencies.

The configuration is pulled through a file called `config.json` that must create
in the root of the project with the following values:

```javascript
{
  "pagespeed": {
    "goodScore": 80,       // minimum "good" score
    "strategy": "mobile",  // can be "mobile" or "desktop",
    "warningScore": 60     // minimum "warning" score
  },
  "slack": {
    "channel": "#infrastructure",  // Slack room to post notifications to
    "incomingWebHook": "https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxx"
  },
  "url": "www.example.com" // url of the site to test with PageSpeed
}

```

## Testing Slack

You can run the following command to see if your messages will end up in Slack:

```bash
node test.js
```
