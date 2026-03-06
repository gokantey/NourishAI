from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.views.defaults import page_not_found

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('meals/', include('meals.urls')),
    path('', RedirectView.as_view(url='/users/login/', permanent=False)),
    
]