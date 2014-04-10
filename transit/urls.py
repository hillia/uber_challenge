from django.conf.urls import patterns, include, url
from django.contrib import admin

from transit import views

urlpatterns = patterns('',
  url(r'^admin/', include(admin.site.urls)),    url(r'^$', views.index, name='index'),
  url(r'^route_list/$', views.route_list, name='route_list'),
  url(r'^route_config/(?P<route>\w+)$', views.route_config, name='route_config')
)
