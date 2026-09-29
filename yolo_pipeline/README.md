# Inspectra Pro — Computer Vision Architecture & Training Documentation

## 1. Dual-Model Computer Vision Architecture (Option B)

Inspectra Pro uses a decoupled **Dual-Model Parallel Inference** architecture designed to maintain high institutional accuracy without risking catastrophic forgetting.

```
Incoming Image / Video Frame (640x640 Float32)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [Model 1: PPE Safety]    [Model 2: Structural Defects]
  construction_safety      construction_defect
  _yolov8.onnx             _yolov8s.onnx
  (14 Classes, FROZEN)     (6 Classes, NEW)
  Output: [1, 18, 8400]    Output: [1, 10, 8400]
         │                       │
         └───────────┬───────────┘
                     ▼
             Merged Detections
                     │
                     ▼
           safetyRules.js Engine
         (Institutional Remediation)
```

---

## 2. Model Specifications

### Model 1: PPE & Site Safety (`construction_safety_yolov8.onnx`)
- **Status:** **FROZEN & PRESERVED** (Zero modification policy)
- **Runtime:** `onnxruntime-node` (CPU Execution Provider)
- **Input Tensor:** `[1, 3, 640, 640]` NCHW Float32
- **Output Tensor:** `[1, 18, 8400]` (4 bounding box coordinates + 14 PPE classes)
- **Classes (14):**
  `Fall-Detected`, `Gloves`, `Goggles`, `Hardhat`, `Ladder`, `Mask`, `NO-Gloves`, `NO-Goggles`, `NO-Hardhat`, `NO-Mask`, `NO-Safety Vest`, `Person`, `Safety Cone`, `Safety Vest`

### Model 2: Construction Defects (`construction_defect_yolov8s.onnx`)
- **Status:** **Phase 2 Expansion Model**
- **Base Checkpoint:** Ultralytics YOLOv8s (`yolov8s.pt`)
- **Input Tensor:** `[1, 3, 640, 640]` NCHW Float32
- **Output Tensor:** `[1, 10, 8400]` (4 bounding box coordinates + 6 defect classes)
- **Classes (6):**
  - `0: Crack`
  - `1: Spalling`
  - `2: Honeycombing`
  - `3: Exposed-Rebar`
  - `4: Concrete-Surface-Damage`
  - `5: Pothole`

---

## 3. Verified Permissive Datasets (Licensing Audit)

| Defect Class | Dataset Source | License | Status |
|---|---|---|---|
| **Crack (0)** | Roboflow: `university-bswxt/crack-bphdr` | **CC BY 4.0** | Approved (Commercial OK) |
| **Crack / Pothole (0, 5)** | RDD2022 (Road Damage Dataset) | **CC BY-SA 4.0** | Approved (Commercial OK with attribution) |
| **Pothole (5)** | Roboflow: `potholes-dataset/pothole-detection` | **CC BY 4.0** | Approved (Commercial OK) |
| **Spalling, Honeycombing, Exposed-Rebar, Surface Damage (1–4)** | Roboflow: `ali-saqlain-bwqfc/concrete-surface-defect` | **CC BY 4.0** | Approved (Commercial OK) |
| **Spalling, Honeycombing, Rebar (Excluded)** | CODEBRIM (TU Munich) | **CC BY-NC 4.0** | **STRICTLY EXCLUDED** (Non-commercial only) |

---

## 4. Pipeline Scripts & Notebook

```
yolo_pipeline/
├── dataset_defect.yaml                 # Active 6-class dataset configuration
├── prepare_dataset.py                  # Downloads & remaps verified commercial defect data
├── validate_dataset.py                 # Validates bounding box coords, class bounds & hashes
├── train_defect.py                     # YOLOv8s training script with ONNX export & tensor checks
├── evaluate_model.py                   # Per-class precision, recall, mAP50 evaluation
├── export_onnx.py                      # Production ONNX exporter with safety guards
├── Inspectra_Pro_Phase2_DefectModel.ipynb # End-to-end Google Colab GPU training notebook
└── generate_notebook.js                # Programmatic notebook generator
```

---

## 5. Execution Workflow

### Step A: Dataset Preparation
```bash
python yolo_pipeline/prepare_dataset.py \
  --output ./yolo_pipeline/dataset_defect \
  --api-key YOUR_ROBOFLOW_API_KEY
```

### Step B: Dataset Validation
```bash
python yolo_pipeline/validate_dataset.py \
  --dataset ./yolo_pipeline/dataset_defect
```

### Step C: Cloud Training on Google Colab (Recommended GPU)
1. Open [Google Colab](https://colab.research.google.com/) and upload `yolo_pipeline/Inspectra_Pro_Phase2_DefectModel.ipynb`.
2. Connect to a free T4 GPU runtime (`Runtime > Change runtime type > T4`).
3. Run all cells sequentially. The notebook downloads data, trains YOLOv8s, evaluates mAP50, exports `construction_defect_yolov8s.onnx`, and validates output shape `[1, 10, 8400]`.
4. Download the generated `construction_defect_yolov8s.onnx` directly to `backend/src/models/ai/`.

### Step D: Local Training (If CUDA GPU Available)
```bash
python yolo_pipeline/train_defect.py \
  --data ./yolo_pipeline/dataset_defect.yaml \
  --model yolov8s.pt \
  --epochs 100 \
  --batch 16 \
  --imgsz 640 \
  --device 0
```

### Step E: Evaluation & Acceptance
```bash
python yolo_pipeline/evaluate_model.py \
  --weights ./yolo_pipeline/runs/defect_yolov8s/weights/best.pt \
  --data ./yolo_pipeline/dataset_defect.yaml
```
Acceptance threshold: Overall mAP50 $\ge 0.70$ (with minimum $\ge 0.50$ on scarce classes like Honeycombing and Exposed-Rebar).
