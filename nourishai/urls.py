# nourishai/urls.py — replace your current urls.py with this

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Catch all non-API routes — serve React's index.html
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name='index.html'), name='react'),
]