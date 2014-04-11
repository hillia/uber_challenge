import json
import requests

from django.core.cache import cache
from xml.etree.ElementTree import XML

class NextbusBase(object):
  def __init__(self, **options):
    self.agency = options['agency']

  def command(self):
    raise Exception('Must override NextbusBase.command')

  def api_params(self):
    return {}

  def _full_api_params(self):
    return dict({ 'command': self.command(), 'a': self.agency }.items() + self.api_params().items())

  def fetch(self):
    self.json = self._fetch_from_cache()
    if self.json is not None:
      return

    xml = XML(self._fetch_raw_xml())
    self.json = self._xml_to_dict(xml)
    self._save_to_cache()

  def _fetch_from_cache(self):
    return cache.get(self.cache_key())

  def _save_to_cache(self):
    cache.set(self.cache_key(), self.json, 86400)

  def cache_key(self):
    return self.command() + ':' + self.agency

  def _fetch_raw_xml(self):
    return requests.get('http://webservices.nextbus.com/service/publicXMLFeed', params=self._full_api_params()).text

  def _xml_to_dict(self, xml):
    dict = xml.attrib
    for child in list(xml):
      tag_plural = child.tag + 's'
      dict.setdefault(tag_plural, [])
      dict[tag_plural].append(self._xml_to_dict(child))
    return dict

  def __json__(self):
    return self.json

  def __str__(self):
    return json.dumps(self.__json__())

