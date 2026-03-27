import os
from utils.get_env import get_app_data_directory_env

APP_DATA_FALLBACK = "/tmp/presenton"


def get_app_data_directory():
    return get_app_data_directory_env() or APP_DATA_FALLBACK


def get_images_directory():
    images_directory = os.path.join(get_app_data_directory(), "images")
    os.makedirs(images_directory, exist_ok=True)
    return images_directory


def get_exports_directory():
    export_directory = os.path.join(get_app_data_directory(), "exports")
    os.makedirs(export_directory, exist_ok=True)
    return export_directory

def get_uploads_directory():
    uploads_directory = os.path.join(get_app_data_directory(), "uploads")
    os.makedirs(uploads_directory, exist_ok=True)
    return uploads_directory
