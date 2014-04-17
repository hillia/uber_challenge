var Transit = Transit || {};

Transit.MapView = Backbone.View.extend({
  loading: false,

  initialize: function(options) {
    this.range = options['range'];
  },

  init_map: function() {
    var zoom;
    if (this.range <= .5) {
      zoom = 15;
    } else if(this.range >= 2) {
      zoom = 11;
    } else {
      zoom = 13;
    }

    var mapOptions = {
      center: new google.maps.LatLng(Transit.Coordinates.current['latitude'], Transit.Coordinates.current['longitude']),
      zoom: zoom
    };
    this.map = new google.maps.Map(this.$el[0], mapOptions);

    this.mark_me(Transit.Coordinates.current);
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
    var nearest_stop = route_config.nearest_stop(Transit.Coordinates.current);

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
    if (Transit.Map.ready && Transit.Coordinates.ready) {
      this.loading = false;
      this.init_map();
    } else if (!this.loading) {
      this.loading = true;
      Transit.Map.on("ready", this.render, this);
      Transit.Coordinates.on('ready', this.render, this);
    }
  }
});