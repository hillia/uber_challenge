import json

from django.http import HttpResponse
from django.shortcuts import render
from django.template import RequestContext
from transit.models.nextbus import RouteConfig
from transit.models.nextbus import RouteList
from transit.models.nextbus import Predictions

def index(request):
  all_routes_json = RouteConfig.get(agency='sf-muni').__str__()
  return render(request, 'index.html', {'all_routes_json': all_routes_json})

def route_list(request):
  return HttpResponse(RouteList.get(agency='sf-muni'))

def route_config(request, route=None):
  return HttpResponse(RouteConfig.get(agency='sf-muni', tag=route))

def predictions(request):
  route_and_stops = request.GET.getlist('stops')
  stops_json = [{'route': route_and_stop.split('|')[0], 'tag': route_and_stop.split('|')[1] } for route_and_stop in route_and_stops]
  return HttpResponse(Predictions.get(agency='sf-muni', stops=stops_json))
