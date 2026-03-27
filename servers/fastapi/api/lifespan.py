from contextlib import asynccontextmanager
import os

from fastapi import FastAPI

from services.database import create_db_and_tables
from utils.asset_directory_utils import get_app_data_directory
from utils.model_availability import (
    check_llm_and_image_provider_api_or_model_availability,
)


@asynccontextmanager
async def app_lifespan(_: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Initializes the application data directory and checks LLM model availability.

    """
    os.makedirs(get_app_data_directory(), exist_ok=True)
    await create_db_and_tables()
    await check_llm_and_image_provider_api_or_model_availability()
    yield
