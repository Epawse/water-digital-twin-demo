from fastapi import APIRouter
from .v1 import sensors, readings, products

api_router = APIRouter()
api_router.include_router(sensors.router, prefix="/sensors", tags=["sensors"])
api_router.include_router(readings.router, prefix="/readings", tags=["readings"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
