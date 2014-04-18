var Transit = Transit || {};

Transit.Predictions = Backbone.Model.extend({

  parse: function(response) {
    if (response['predictionss'] != undefined) {
      // If we're fetching from the server, it will return it in the NextBus API format.
      return response['predictionss'][0];
    } else {
      // But if PredictionList is creating them, it will just pass the attributes.
      return response;
    }
  },

  url: function() {
    return 'predictions/?stops=' + this.get('route') + '|' + this.get('stop');
  }

});
