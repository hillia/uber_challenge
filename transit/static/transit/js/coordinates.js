var Transit = Transit || {};

// TODO: If a listener is added and ready is already triggered, trigger it on that listener.
Transit.Coordinates = _.extend({ ready: false }, Backbone.Events);

$(function() {
  navigator.geolocation.getCurrentPosition(function(geolocation) {
    Transit.Coordinates.current = geolocation['coords'];
    Transit.Coordinates.ready = true;
    Transit.Coordinates.trigger('ready');
  });
});