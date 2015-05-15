var _ = require('lodash');
var prettyBytes = require('pretty-bytes');
var psi = require('psi');
var request = require('request');

var config = require('./config.json');

console.log('Loading function');

function byteFormatter(value) {
  return prettyBytes(parseFloat(value));
}

function numberFormatter(value) {
  return value;
}

function colorForScore(score) {
  if (score >= config.pagespeed.goodScore) {
    return 'good';
  } else if (score >= config.pagespeed.warningScore) {
    return 'warning';
  } else {
    return 'danger';
  }
}

function pageStatFields(data) {
  var display = {
    cssResponseBytes: { formatter: byteFormatter, label: 'CSS size' },
    htmlResponseBytes: { formatter: byteFormatter, label: 'HTML size' },
    imageResponseBytes: { formatter: byteFormatter, label: 'Image size' },
    javascriptResponseBytes: { formatter: byteFormatter, label: 'JavaScript size' },
    numberCssResources: { formatter: numberFormatter, label: 'CSS Resources' },
    numberHosts: { formatter: numberFormatter, label: 'Hosts' },
    numberJsResources: { formatter: numberFormatter, label: 'JS Resources' },
    numberResources: { formatter: numberFormatter, label: 'Total Resources' },
    numberStaticResources: { formatter: numberFormatter, label: 'Static Resources' },
    totalRequestBytes: { formatter: byteFormatter, label: 'Total Size' }
  };

  return _.map(data, function(value, key) {
    return {
      short: true,
      title: display.hasOwnProperty(key) && display[key].hasOwnProperty('label') ? display[key].label : key,
      value: display.hasOwnProperty(key) && display[key].hasOwnProperty('formatter') ? display[key].formatter(value) : value
    };
  });
}

exports.handler = function(event, context) {
  var options = {
    strategy: config.pagespeed.strategy,
    threshold: config.pagespeed.warningScore
  };

  psi(config.url, options, function (error, data) {
    if (error) {
      context.fail(error);
    } else {
      var payload = {
        channel: config.slack.channel,
        attachments: [
          {
            fallback: 'Google PageSpeed score (' + options.strategy + '): ' + data.score + "\nhttps://developers.google.com/speed/pagespeed/insights/?url=" + config.url,
            title: 'Google PageSpeed score (' + options.strategy + '): ' + data.score,
            title_link: 'https://developers.google.com/speed/pagespeed/insights/?url=' + config.url,
            fields: pageStatFields(data.pageStats),
            color: colorForScore(data.score)
          }
        ]
      };

      request({
        url: config.slack.incomingWebHook,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json'
        },
        body: payload
      }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          context.succeed(body);
        } else {
          context.fail(JSON.stringify(response));
        }
      });
    }
  });
};
