import json

from django.http import HttpResponse
from django.shortcuts import render
from django.template import RequestContext
from transit.models import RouteConfig
from transit.models import RouteList

def index(request):
  all_routes_json = RouteConfig.get(agency='sf-muni').__str__()
  return render(request, 'transit/views/index.haml', {'all_routes_json': all_routes_json})

def route_list(request):
  return HttpResponse(RouteList.get(agency='sf-muni'))

def route_config(request, route=None):
  return HttpResponse(RouteConfig.get(agency='sf-muni', tag=route))
