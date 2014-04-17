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
      return this.distance_squared <= Math.pow(Math.abs(miles / RouteHelpers.MILES_PER_MERIDIANS), 2);
    },

    nearest_stop: function(coordinates) {
      this.geolocate(coordinates);
      return this._nearest_stop;
    }
  });

  RouteConfigList = Backbone.Collection.extend({
    model: RouteConfig,

    parse: function(response) { return response.routes; },

    url: function() { return 'route_config/'; },
  });

  RouteConfigListView = Backbone.View.extend({
    loading: false,

    events: {
      'mouseover .route': 'map_route'
    },

    initialize: function(options) {
      this.range = options['range'];
    },

    map_route: function(evt) {
      $route = $(evt.currentTarget);
      var route_config = this.model.findWhere({ tag: String($route.data('tag')) });

      $('.route').removeClass('selected');
      $route.addClass('selected');
      MapView.singleton.draw_route(route_config);
    },

    render_nearby_routes: function() {
      this.$el.html('');
      _.each(this.model.models, function(route_config) {
        if (route_config.is_within(this.range, Coordinates.current)) {
          this.render_route(route_config);
        }
      }, this);
    },

    render_route: function(route_config) {
      this.$el.append(Mustache.render(Mustache.TEMPLATES.route_config_list_item, {
        tag: route_config.get('tag'),
        nearest_stop: route_config.nearest_stop(Coordinates.current)['title'],
        title: route_config.get('title'),
        color: route_config.get('color')
      }));
    },

    render: function() {
      if (Coordinates.ready && this.model.length > 0) {
        this.loading = false;
        this.render_nearby_routes();
      } else if (!this.loading) {
        this.loading = true;
        Coordinates.on('ready', this.render, this);
        this.model.on('add', this.render, this);
      }
    }
  });

  MapView = Backbone.View.extend({
    loading: false,

    init_map: function() {
      var mapOptions = {
        center: new google.maps.LatLng(Coordinates.current['latitude'], Coordinates.current['longitude']),
        zoom: 15
      };
      this.map = new google.maps.Map(this.$el[0], mapOptions);

      this.mark_me(Coordinates.current);
    },

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
      var nearest_stop = route_config.nearest_stop(Coordinates.current);

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
        route_path.setMap(this.map);

        return route_path;
      }, this);

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
          map: this.map,
          position: new google.maps.LatLng(parseFloat(stop['lat']), parseFloat(stop['lon'])),
          title: route_config.get('tag') + " stop at " + stop['title'],
          icon: (nearest_stop == stop ? nearest_stop_icon : normal_stop_icon)
        });
      }, this);
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
      if (Map.ready && Coordinates.ready) {
        this.loading = false;
        this.init_map();
      } else if (!this.loading) {
        this.loading = true;
        Map.on("ready", this.render, this);
        Coordinates.on('ready', this.render, this);
      }
    }
  });

  RouteConfigIndexView = Backbone.View.extend({
    initialize: function(opts) {
      this.listening = false;
      this.range = opts['range'];
    },

    render: function() {
      this.$el.html('<div class="route-config-list">' + Mustache.TEMPLATES.spinner + '</div> <div class="map">' + Mustache.TEMPLATES.spinner + '</div>');

      MapView.singleton = new MapView({ el: '.map' });
      MapView.singleton.render();

      this.list_view = new RouteConfigListView({ el: '.route-config-list', model: this.model, range: this.range });
      this.list_view.render();
    }
  });

  IndexView = Backbone.View.extend({
    render: function() {
      this.$el.html(Mustache.TEMPLATES.intro_screen);
      this.$el.find('#find-muni-button').click(function() {
        TransitApp.navigate('routes/nearby/.25', {trigger: true});
      });
    }
  });

  TransitRouter = Backbone.Router.extend({
    routes: {
      "":                         "index",
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