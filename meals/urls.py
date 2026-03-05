from django.urls import path
from . import views

app_name = 'meals'

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('generate/', views.generate_plan, name='generate_plan'),
    path('plan/<int:pk>/', views.meal_plan_detail, name='meal_plan_detail'),
    path('meal/<int:pk>/', views.meal_detail, name='meal_detail'),
    path('meal/<int:pk>/regenerate/', views.regenerate_meal, name='regenerate_meal'),
    path('plan/<int:pk>/save/', views.toggle_save_plan, name='toggle_save_plan'),
    path('plan/<int:pk>/confirm-save/', views.confirm_save_plan, name='confirm_save_plan'),
]