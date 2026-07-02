from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(("config.api_urls", "v1"), namespace="v1")),
    path("api/v1/public/", include(("config.public_urls", "public"), namespace="public")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
