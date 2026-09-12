# Inspectra Pro — YOLO AI Computer Vision Architecture & Training Documentation

## 1. Overview
Inspectra Pro incorporates an authentic computer vision detection pipeline powered by **YOLOv8** and executed via **ONNX Runtime (`onnxruntime-node`)** in production. The system performs real-time neural network tensor evaluation on inspection photos and site camera feeds.

---

## 2. Dataset Specification

- **Primary Dataset**: [Roboflow Universe — Personal Protective Equipment Combined Benchmark v4](https://universe.roboflow.com/roboflow-universe-projects/personal-protective-equipment-combined-model)
- **License**: Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Format**: Standard YOLO Darknet annotation format (`class_id x_center y_center width height` normalized $[0, 1]$).
- **Target Classes (14)**:
  1. `0: Fall-Detected`
  2. `1: Gloves`
  3. `2: Goggles`
  4. `3: Hardhat`
  5. `4: Ladder`
  6. `5: Mask`
  7. `6: NO-Gloves`
  8. `7: NO-Goggles`
  9. `8: NO-Hardhat`
  10. `9: NO-Mask`
  11. `10: NO-Safety Vest`
  12. `11: Person`
  13. `12: Safety Cone`
  14. `13: Safety Vest`

---

## 3. Directory Structure

```
yolo_pipeline/
├── dataset.yaml             # Ultralytics dataset configuration
├── train_yolo.py            # Model training / fine-tuning script
├── export_onnx.py           # ONNX production model exporter
├── dataset/
│   ├── images/
│   │   ├── train/           # Training split images
│   │   ├── val/             # Validation split images
│   │   └── test/            # Test split images
│   └── labels/
│       ├── train/           # Normalized YOLO .txt annotations
│       ├── val/             # Validation annotations
│       └── test/            # Test annotations
└── README.md
```

---

## 4. How to Train or Fine-Tune

### Prerequisites
```bash
pip install ultralytics torch torchvision
```

### Run Fine-Tuning
```bash
python yolo_pipeline/train_yolo.py \
  --data yolo_pipeline/dataset.yaml \
  --model yolov8n.pt \
  --epochs 50 \
  --batch 16 \
  --imgsz 640 \
  --device 0
```

### Export to Production ONNX
```bash
python yolo_pipeline/export_onnx.py \
  --weights runs/train/inspectra_yolo_v1/weights/best.pt \
  --output backend/src/models/ai/construction_safety_yolov8.onnx
```

---

## 5. Production Node.js Inference Engine

- Runtime: `onnxruntime-node` (C++ native inference engine)
- Preprocessing: Decodes JPEG/PNG, letterboxes to $640 \times 640$, normalizes to planar Float32 $[1, 3, 640, 640]$.
- Postprocessing: Transposes $1 \times (4 + \text{classes}) \times 8400$ output tensor, filters by confidence threshold ($\ge 0.25$), and applies IoU Non-Maximum Suppression (NMS threshold $0.45$).
- Output: Exact bounding box pixel coordinates, real class name, real confidence float score, decoupled institutional severity rating, and recommended corrective action.
