var Transit = Transit || {};

Transit.PredictionsList = Backbone.Collection.extend({
  model: Transit.Predictions,

  initialize: function(options) {
    this.stops = options['stops'];
  },

  parse: function(response) {
    return response['predictionss'];
  },

  url: function() {
    stop_params = _.map(this.stops, function(stop) {
      return 'stops=' + stop['route'] + '|' + stop['stop'];
    });
    return 'predictions?' + stop_params.join('&');
  },
});