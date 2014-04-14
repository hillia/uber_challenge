$(function () {

  Coordinates = _.extend({}, Backbone.Events);
  navigator.geolocation.getCurrentPosition(function(geolocation) {
    Coordinates.current = geolocation['coords'];
    Coordinates.trigger('ready');
  });

  RouteHelpers = {
    MILES_PER_MERIDIANS: 69 // Rough approximation
  };

  RouteConfig = Backbone.Model.extend({
    url: function() {
      return 'route_config/' + (this.get('tag') || '');
    },

    // TODO: Geolocated RouteConfig should probably be a separate model: GeolocatedRoute
    geolocate: function(coordinates) {
      this.coordinates = coordinates;
      this.distance_squared = Number.POSITIVE_INFINITY;
      var route = this.get('routes')[0];
      var self = this;
      // TODO: Should compare to route's max/min lon/lat first to see if any stop is in range.
      _.each(route['stops'], function(stop) {
        var stop_lat = parseFloat(stop['lat']);
        var stop_lon = parseFloat(stop['lon']);
        var stop_distance_squared = Math.pow(Math.abs(stop_lat - self.coordinates['latitude']), 2) + Math.pow(Math.abs(stop_lon - self.coordinates['longitude']), 2);
        if (stop_distance_squared < self.distance_squared) {
          self.distance_squared = stop_distance_squared;
          self.nearest_stop = stop;
        }
      });
    },

    is_within: function(miles) {
      return this.distance_squared <= Math.pow(Math.abs(miles / RouteHelpers.MILES_PER_MERIDIANS), 2);
    },

    nearby_routes: function(my_coordinates, range_in_miles) {
      var _nearby_routes = [];
      var routes = this.get('routes');

      _.each(routes, function(route) {
        var route_config = new RouteConfig({ routes: [route] });
        route_config.geolocate(my_coordinates);
        if (route_config.is_within(range_in_miles)) {
          _nearby_routes.push(route_config);
        }
      });

      return _nearby_routes;
    },

    tag: function() {
      return this.get('routes')[0]['tag'];
    }
  });

  RouteConfigSummaryView = Backbone.View.extend({
    initialize: function(options) {
      this.range = options['range'];
      if (Coordinates.current != undefined) {
        this.render();
      } else {
        var self = this;
        Coordinates.on('ready', function() { self.render(); });
      }
    },

    render: function() {
      route_configs = this.model.nearby_routes(Coordinates.current, this.range);
      var self = this;
      _.each(route_configs, function(route_config) {
        self.$el.append(Mustache.render(Mustache.TEMPLATES.route_config_summary, { tag: route_config.tag(), nearest_stop: route_config.nearest_stop['title'] }));
      });
    }
  });
});