from django.conf.urls import patterns, include, url
from django.contrib import admin

from transit import views

urlpatterns = patterns('',
  url(r'^admin/', include(admin.site.urls)),
  url(r'^transit/', include('transit.urls')),
)
