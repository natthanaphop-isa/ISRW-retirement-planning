from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from models import CalculationRequest, CalculationResponse
from calculator import calculate_deterministic
from monte_carlo import calculate_monte_carlo

app = FastAPI(title="Retirement Planner API")

origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/calculate", response_model=CalculationResponse)
def calculate(req: CalculationRequest):
    det_res, passive_summary = calculate_deterministic(req)
    mc_res = calculate_monte_carlo(req)
    return CalculationResponse(
        deterministic=det_res,
        monte_carlo=mc_res,
        passive_income_summary=passive_summary
    )

# Serve frontend
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
