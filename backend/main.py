import io

import numpy as np
import torch
import torchvision.transforms as transforms
import torchxrayvision as xrv
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from skimage.io import imread

app = FastAPI(title="Chest X-Ray AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
model = xrv.models.DenseNet(weights="densenet121-res224-chex")
model.eval()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    # Read image as grayscale
    img = imread(io.BytesIO(contents), as_gray=True)

    # Normalize to [0, 255] range if needed
    if img.max() <= 1.0:
        img = (img * 255).astype(np.uint8)

    # Convert to float32 and scale to [-1024, 1024] as expected by torchxrayvision
    img = img.astype(np.float32)
    img = xrv.datasets.normalize(img, 255)

    # Resize to 224x224
    transform = transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224),
    ])

    img = transform(img[np.newaxis, ...])  # Add channel dimension
    img = torch.from_numpy(img).unsqueeze(0)  # Add batch dimension

    # Run inference
    with torch.no_grad():
        preds = model(img)

    # Build results sorted by probability (descending)
    pathologies = model.pathologies
    probabilities = preds[0].numpy()

    results = [
        {"pathology": name, "probability": round(float(prob), 4)}
        for name, prob in zip(pathologies, probabilities)
    ]
    results.sort(key=lambda x: x["probability"], reverse=True)

    return {"predictions": results}
