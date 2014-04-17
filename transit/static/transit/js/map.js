var Transit = Transit || {};

// TODO: If a listener is added and ready is already triggered, trigger it on that listener.
Transit.Map = _.extend({ ready: false }, Backbone.Events);

$(function() {
  google.maps.event.addDomListener(window, 'load', function() {
    Transit.Map.ready = true;
    Transit.Map.trigger('ready');
  });
});
