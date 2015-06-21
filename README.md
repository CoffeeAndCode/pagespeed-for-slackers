# PageSpeed for Slackers

This will run an AWS Lambda function to collect Google PageSpeed information
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
    "warningScore": 60     // minimum "warning" score
  },
  "slack": {
    "channel": "#infrastructure",  // Slack room to post notifications to
    "incomingWebHook": "https://hooks.slack.com/services/xxxxxx/xxxxxx/xxxxxx"
  }
}
```

## Testing Slack

You can run the following command to see if your messages will end up in Slack:

```bash
node test.js
```

## Creating Zip File For Lamda

Once the app is working in the `Testing Slack` section, you can package up your
app for uploading to Lambda with the following command:

```bash
npm run-script package
```

## Trigging the Lambda Function

Originally, the intent was to watch S3 events and trigger the lambda function
when the bucket content changes. However, the current limitation of not being able
to filter viable events and throttling caused by too many events at the same time
forced me to manually trigger the lambda function as an additional step of the build
process.

```bash
aws lambda invoke --invocation-type RequestResponse \
                  --function-name YourLambdaFunctionName \
                  --region us-east-1 \
                  --payload '{"url": "http://example.com"}' \
                  YourLambdaFunctionName-output.txt
```
