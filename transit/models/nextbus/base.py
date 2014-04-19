import json
import requests

from django.core.cache import cache
from xml.etree.ElementTree import XML

class NextbusBase(object):
  def __getitem__(self, key):
    return self.data[key]

  def __init__(self, **options):
    self.agency = options['agency']

  def command(self):
    raise Exception('Must override NextbusBase.command')

  def api_params(self):
    return {}

  def _full_api_params(self):
    return dict({ 'command': self.command(), 'a': self.agency }.items() + self.api_params().items())

  def fetch(self):
    self.data = self._fetch_from_cache()
    if self.data is not None:
      return

    xml = XML(self._fetch_raw_xml())
    self.data = self._xml_to_dict(xml)
    self._save_to_cache()

  def _fetch_from_cache(self):
    return cache.get(self.cache_key())

  def _save_to_cache(self):
    cache.set(self.cache_key(), self.data, self.cache_expiration())

  def cache_key(self):
    return self.command() + ':' + self.agency

  def cache_expiration(self):
    return 86400

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
    return json.dumps(self.data)

  def __str__(self):
    return self.__json__()

