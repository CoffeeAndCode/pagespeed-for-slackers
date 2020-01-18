var _ = require("lodash");
var Promise = require("bluebird");
var prettyBytes = require("pretty-bytes");
var psi = Promise.promisify(require("psi"));
var request = require("request");

var config = require("./config.json");

console.log("Loading function");

function byteFormatter(value) {
  return prettyBytes(parseFloat(value));
}

function colorForScore(score) {
  if (score >= config.pagespeed.goodScore) {
    return "good";
  } else if (score >= config.pagespeed.warningScore) {
    return "warning";
  } else {
    return "danger";
  }
}

function createAttachment(data, strategy, url) {
  return {
    fallback:
      "Google PageSpeed score (" +
      strategy +
      "): " +
      data.score +
      "\nhttps://developers.google.com/speed/pagespeed/insights/?url=" +
      url +
      "&tab=" +
      config.pagespeed.strategy,
    title: "Google PageSpeed score (" + strategy + "): " + data.score,
    title_link:
      "https://developers.google.com/speed/pagespeed/insights/?url=" +
      url +
      "&tab=" +
      strategy,
    fields: pageStatFields(data.pageStats),
    color: colorForScore(data.score),
    text: url
  };
}

function numberFormatter(value) {
  return value;
}

function pageStatFields(data) {
  var display = {
    cssResponseBytes: { formatter: byteFormatter, label: "CSS size" },
    htmlResponseBytes: { formatter: byteFormatter, label: "HTML size" },
    imageResponseBytes: { formatter: byteFormatter, label: "Image size" },
    javascriptResponseBytes: {
      formatter: byteFormatter,
      label: "JavaScript size"
    },
    numberCssResources: { formatter: numberFormatter, label: "CSS Resources" },
    numberHosts: { formatter: numberFormatter, label: "Hosts" },
    numberJsResources: { formatter: numberFormatter, label: "JS Resources" },
    numberResources: { formatter: numberFormatter, label: "Total Resources" },
    numberStaticResources: {
      formatter: numberFormatter,
      label: "Static Resources"
    },
    totalRequestBytes: { formatter: byteFormatter, label: "Total Size" }
  };

  return _.map(data, function(value, key) {
    return {
      short: true,
      title:
        display.hasOwnProperty(key) && display[key].hasOwnProperty("label")
          ? display[key].label
          : key,
      value:
        display.hasOwnProperty(key) && display[key].hasOwnProperty("formatter")
          ? display[key].formatter(value)
          : value
    };
  });
}

function postToSlack(context, attachments) {
  var payload = {
    channel: config.slack.channel,
    attachments: attachments
  };

  request(
    {
      url: config.slack.incomingWebHook,
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json"
      },
      body: payload
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        context.succeed(body);
      } else {
        context.fail(JSON.stringify(response, null, 2));
      }
    }
  );
}

exports.handler = function(event, context) {
  console.log("Lambda event data:");
  console.log(JSON.stringify(event, null, 2));

  if (event.hasOwnProperty("url")) {
    Promise.map(["desktop", "mobile"], function(strategy) {
      return psi(event.url, {
        strategy: strategy,
        threshold: config.pagespeed.warningScore
      }).then(function(data) {
        return createAttachment(data, strategy, event.url);
      });
    }).then(function(attachments) {
      postToSlack(context, attachments);
    });
  } else {
    context.fail('Event data did not include "url" property.');
  }
};
