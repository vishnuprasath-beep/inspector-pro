#!/usr/bin/env python3
"""
Inspectra Pro — Continuous AI Improvement: YOLOv8 Construction Safety Fine-Tuning
================================================================================
Trains or fine-tunes YOLOv8 on authentic construction site safety PPE & defect datasets.

Dataset Specification:
- Personal Protective Equipment Combined Model v4 (Roboflow Universe, CC-BY-4.0)
- Classes: Fall-Detected, Gloves, Goggles, Hardhat, Ladder, Mask, NO-Gloves,
           NO-Goggles, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest.

Usage:
  python train_yolo.py --epochs 50 --batch 16 --imgsz 640 --model yolov8n.pt --device cpu
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="Inspectra Pro YOLOv8 Training Pipeline")
    parser.add_argument("--data", type=str, default="./dataset.yaml", help="Path to dataset.yaml")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Base model (yolov8n.pt, yolov8s.pt, yolov8m.pt)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--device", type=str, default="0", help="Device (0 for GPU, cpu for CPU)")
    parser.add_argument("--project", type=str, default="./runs/train", help="Save directory")
    parser.add_argument("--name", type=str, default="inspectra_yolo_v1", help="Run name")
    args = parser.parse_args()

    print("=================================================================")
    print("INSPECTRA PRO: YOLOv8 CONSTRUCTION SAFETY TRAINING PIPELINE")
    print("=================================================================")
    print(f"Base Model:       {args.model}")
    print(f"Dataset Config:   {args.data}")
    print(f"Epochs:           {args.epochs}")
    print(f"Batch Size:       {args.batch}")
    print(f"Image Resolution: {args.imgsz}x{args.imgsz}")
    print(f"Target Device:    {args.device}")
    print("=================================================================\n")

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] Ultralytics package is not installed.")
        print("Please install requirements: pip install ultralytics torch torchvision")
        sys.exit(1)

    if not os.path.exists(args.data):
        print(f"[ERROR] Dataset configuration file '{args.data}' not found.")
        sys.exit(1)

    print("[1] Loading base model weights...")
    model = YOLO(args.model)

    print("[2] Initiating fine-tuning with hyperparameter optimization...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        project=args.project,
        name=args.name,
        save=True,
        plots=True
    )

    print("\n[3] Training complete. Exporting best checkpoint to ONNX...")
    best_weights = os.path.join(args.project, args.name, "weights", "best.pt")
    if os.path.exists(best_weights):
        best_model = YOLO(best_weights)
        onnx_file = best_model.export(format="onnx", imgsz=args.imgsz, opset=12)
        print(f"[SUCCESS] Exported production model to: {onnx_file}")
    else:
        print(f"[WARNING] Best weights file not found at: {best_weights}")

if __name__ == "__main__":
    main()
