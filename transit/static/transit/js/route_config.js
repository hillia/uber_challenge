var Transit = Transit || {};

Transit.RouteConfig = Backbone.Model.extend({
  MILES_PER_MERIDIANS: 69, // Rough approximation

  parse: function(response) {
    if (response['routes'] != undefined) {
      // If we're fetching from the server, it will return it in the NextBus API format.
      return response['routes'][0];
    } else {
      // But if RouteConfigList is creating them, it will just pass the attributes.
      return response;
    }
  },

  url: function() {
    return 'route_config/' + this.get('tag');
  },

  geolocate: function(coordinates) {
    if (coordinates == this.coordinates) { return }

    this.coordinates = coordinates;
    this.distance_squared = Number.POSITIVE_INFINITY;

    // TODO: Should compare to route's max/min lon/lat first to see if any stop is in range.
    _.each(this.get('stops'), function(stop) {
      var stop_lat = parseFloat(stop['lat']);
      var stop_lon = parseFloat(stop['lon']);
      var stop_distance_squared = Math.pow(Math.abs(stop_lat - this.coordinates['latitude']), 2) + Math.pow(Math.abs(stop_lon - this.coordinates['longitude']), 2);
      if (stop_distance_squared < this.distance_squared) {
        this.distance_squared = stop_distance_squared;
        this._nearest_stop = stop;
      }
    }, this);
  },

  is_within: function(miles, coordinates) {
    this.geolocate(coordinates);
    return this.distance_squared <= Math.pow(Math.abs(miles / this.MILES_PER_MERIDIANS), 2);
  },

  nearest_stop: function(coordinates) {
    this.geolocate(coordinates);
    return this._nearest_stop;
  }
});