from django.apps import AppConfig


class BuildingsAppConfig(AppConfig):
    name = 'buildings_app'

    def ready(self):
        import buildings_app.signals
