$(function () {

  // TODO: If a listener is added and ready is already triggered, trigger it on that listener.
  Coordinates = _.extend({ ready: false }, Backbone.Events);
  navigator.geolocation.getCurrentPosition(function(geolocation) {
    Coordinates.current = geolocation['coords'];
    Coordinates.ready = true;
    Coordinates.trigger('ready');
  });

  // TODO: If a listener is added and ready is already triggered, trigger it on that listener.
  Map = _.extend({ ready: false }, Backbone.Events);
  google.maps.event.addDomListener(window, 'load', function() {
    Map.ready = true;
    Map.trigger('ready');
  });

  RouteHelpers = {
    MILES_PER_MERIDIANS: 69 // Rough approximation
  };

  RouteConfig = Backbone.Model.extend({
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

    // TODO: Geolocated RouteConfig should probably be a separate model: GeolocatedRoute
    geolocate: function(coordinates) {
      if (coordinates == this.coordinates) { return }

      this.coordinates = coordinates;
      this.distance_squared = Number.POSITIVE_INFINITY;
      var self = this;
      // TODO: Should compare to route's max/min lon/lat first to see if any stop is in range.
      _.each(this.get('stops'), function(stop) {
        var stop_lat = parseFloat(stop['lat']);
        var stop_lon = parseFloat(stop['lon']);
        var stop_distance_squared = Math.pow(Math.abs(stop_lat - self.coordinates['latitude']), 2) + Math.pow(Math.abs(stop_lon - self.coordinates['longitude']), 2);
        if (stop_distance_squared < self.distance_squared) {
          self.distance_squared = stop_distance_squared;
          self._nearest_stop = stop;
        }
      });
    },

    is_within: function(miles) {
      return this.distance_squared <= Math.pow(Math.abs(miles / RouteHelpers.MILES_PER_MERIDIANS), 2);
    },

    nearest_stop: function() {
      if (this.coordinates == undefined) {
        throw "Cannot determine nearest stop unless geolocate() has been called.";
      }
      return this._nearest_stop;
    }
  });

  RouteConfigList = Backbone.Collection.extend({
    model: RouteConfig,

    parse: function(response) { return response.routes; },

    url: function() { return 'route_config/'; },

    // TODO: This should be a static function that returns a RouteConfigList with just nearby routes
    nearby_routes: function(my_coordinates, range_in_miles) {
      nearby_route_list = new RouteConfigList();

      nearby_route_list.models = _.filter(this.models, function(route_config) {
        route_config.geolocate(my_coordinates);
        return route_config.is_within(range_in_miles);
      });

      return nearby_route_list;
    }
  });

  RouteConfigListView = Backbone.View.extend({
    events: {
      'mouseover .route': 'show_route'
    },

    initialize: function(options) {
      this.range = options['range'];
    },

    show_route: function(evt) {
      $route = $(evt.currentTarget);
      var route_config = this.model.findWhere({ tag: String($route.data('tag')) });

      $('.route').removeClass('selected');
      $route.addClass('selected');
      MapView.singleton.draw_route(route_config);
    },

    render: function() {
      // TODO: This should just render the list agnostic of whether it's near or not.
      route_list = this.model.nearby_routes(Coordinates.current, this.range);
      this.$el.html('');
      var self = this;
      _.each(route_list.models, function(route_config) {
        self.$el.append(Mustache.render(Mustache.TEMPLATES.route_config_list_item, {
          tag: route_config.get('tag'),
          nearest_stop: route_config.nearest_stop()['title'],
          title: route_config.get('title'),
          color: route_config.get('color')
        }));
      });
    }
  });

  MapView = Backbone.View.extend({
    draw_route: function(route_config) {
      if (this.nearest_stop_marker != undefined) {
        this.nearest_stop_marker.setMap(null);
      }
      if (this.route_paths != undefined) {
        _.each(this.route_paths, function(path) {
          path.setMap(null);
        });
      }
      if (this.stop_markers != undefined) {
        _.each(this.stop_markers, function(stop_marker) {
          stop_marker.setMap(null);
        })
      }

      this.nearest_stop_marker = null;
      this.route_paths = null;
      this.stop_markers = null;

      var route_color = route_config.get('color');
      var nearest_stop = route_config.nearest_stop();

      var self = this;
      this.route_paths = _.map(route_config.get('paths'), function(path) {
        var route_points = _.map(path['points'], function(point) {
          return new google.maps.LatLng(parseFloat(point['lat']), parseFloat(point['lon']));
        });

        var route_path = new google.maps.Polyline({
          path: route_points,
          geodesic: true,
          strokeColor: route_color,
          strokeOpacity: 0.4,
          strokeWeight: 4,
          icons: [{
            offset: '50%',
            icon: {
              path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
              scale: 3
            }
          }],
          zIndex: 0
        });
        route_path.setMap(self.map);

        return route_path;
      });

      var nearest_stop_icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        strokeColor: route_color,
        strokeOpacity: 0.9,
        strokeWeight: 5
      }

      var normal_stop_icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 0.7,
        fillColor: route_color,
        scale: 4,
        strokeOpacity: 0
      }

      this.stop_markers = _.map(route_config.get('stops'), function(stop) {
        return new google.maps.Marker({
          map: self.map,
          position: new google.maps.LatLng(parseFloat(stop['lat']), parseFloat(stop['lon'])),
          title: route_config.get('tag') + " stop at " + stop['title'],
          icon: (nearest_stop == stop ? nearest_stop_icon : normal_stop_icon)
        });
      });
    },

    mark_me: function(coordinates) {
      this.me_marker = new google.maps.Marker({
        map: this.map,
        draggable: false,
        position: new google.maps.LatLng(coordinates['latitude'], coordinates['longitude']),
        title: 'You',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillOpacity: 1,
          scale: 7,
          strokeOpacity: 0
        },
        zIndex: 9001
      });
    },

    render: function() {
      var mapOptions = {
        center: new google.maps.LatLng(Coordinates.current['latitude'], Coordinates.current['longitude']),
        zoom: 15
      };
      this.map = new google.maps.Map(this.$el[0], mapOptions);
      this.mark_me(Coordinates.current);
    }
  });

  RouteConfigIndexView = Backbone.View.extend({
    initialize: function(opts) {
      this.listening = false;
      this.range = opts['range'];
    },

    render: function() {
      if (!this.listening) {
        this.listening = true;
        Map.on('ready', this.render, this);
        Coordinates.on('ready', this.render, this);
        this.model.on('changed', this.render, this);
      }

      if (Map.ready && Coordinates.ready && this.model.length > 0) { this._render(); }
    },

    _render: function() {
      this.$el.html('<div class="route-config-list"></div> <div class="map"></div>');
      this.list_view = new RouteConfigListView({ el: '.route-config-list', model: this.model, range: this.range });
      this.list_view.render();

      MapView.singleton = new MapView({ el: this.$el.find('.map') });
      MapView.singleton.render();
    }
  });

  IndexView = Backbone.View.extend({
    initialize: function() {},

    render: function() {
      this.$el.html(Mustache.render(Mustache.TEMPLATES.intro_screen));
      this.$el.find('#find-muni-button').click(function() {
        TransitApp.navigate('routes/nearby/.25', {trigger: true});
      });
    }
  });

  TransitRouter = Backbone.Router.extend({
    routes: {
      "":                          "index",
      "routes/nearby/:range":     "routes_nearby"
    },

    index: function() {
      this.indexView = new IndexView({ el: '#main-view' });
      this.indexView.render();
    },

    routes_nearby: function(range) {
      var route_list = new RouteConfigList();
      route_list.fetch();
      this.nearbyRoutesView = new RouteConfigIndexView({ el: '#main-view', model: route_list, range: parseFloat(range) });
      this.nearbyRoutesView.render();
    }
  });

});