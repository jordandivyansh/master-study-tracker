from django.urls import re_path
from django.views.generic.base import RedirectView
from master import views as v

urlpatterns = [
    re_path(r'^api/health/?$', v.health),
    re_path(r'^api/session/?$', v.session_view),
    re_path(r'^api/login/?$', v.login_view),
    re_path(r'^api/logout/?$', v.logout_view),
    re_path(r'^api/settings/?$', v.settings_view),
    re_path(r'^api/dashboard/?$', v.dashboard),
    re_path(r'^api/daily(?:/(?P<day>[^/]+))?/?$', v.daily),
    re_path(r'^api/backup/?$', v.backup),
    re_path(r'^api/restore/?$', v.restore),
    re_path(r'^api/(?P<resource>weeks|tests|backlog|apfc/modules|apfc/areas|apfc/entries|cava|pyqs)(?:/(?P<uid>[a-f0-9]{24}))?/?$', v.resource),
    re_path(r'^api(?:/(?P<route>.*))?$', v.unknown_api),
    re_path(r'^(?:simple|v2|v3|beta-version)(?:/.*)?$', RedirectView.as_view(url='/', permanent=False)),
    re_path(r'^(?:dev-guide)(?:/.*)?$', RedirectView.as_view(url='/guide', permanent=False)),
    re_path(r'^(?P<route>.*)$', v.frontend),
]
