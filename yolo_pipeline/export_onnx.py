#!/usr/bin/env python3
"""
Inspectra Pro — YOLO Model Exporter to Production ONNX
=====================================================
Exports PyTorch weights (.pt) to optimized ONNX format for Node.js onnxruntime-node.

Usage:
  python export_onnx.py --weights best.pt --output ../backend/src/models/ai/construction_safety_yolov8.onnx
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="Export YOLO PyTorch weights to ONNX")
    parser.add_argument("--weights", type=str, default="best.pt", help="Path to .pt weights")
    parser.add_argument("--output", type=str, default="model.onnx", help="Destination ONNX path")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    args = parser.parse_args()

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] Ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    if not os.path.exists(args.weights):
        print(f"[ERROR] Weights file not found: {args.weights}")
        sys.exit(1)

    print(f"Loading checkpoint: {args.weights}")
    model = YOLO(args.weights)

    print("Exporting to ONNX format (opset 12, dynamic=False)...")
    exported_path = model.export(format="onnx", imgsz=args.imgsz, opset=12, simplify=True)
    print(f"Export successful: {exported_path}")

    if args.output and args.output != exported_path:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        import shutil
        shutil.copyfile(exported_path, args.output)
        print(f"Copied ONNX model to production directory: {args.output}")

if __name__ == "__main__":
    main()
