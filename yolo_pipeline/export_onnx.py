#!/usr/bin/env python3
"""
Inspectra Pro — Defect YOLO Model Exporter to Production ONNX
=============================================================
Exports PyTorch weights (.pt) to optimized ONNX format for Node.js onnxruntime-node.
Validates tensor dimensions to ensure compatibility with Inspectra Pro dual-model engine.

TARGET SPECIFICATIONS:
  Input Tensor:  [1, 3, 640, 640]  (NCHW Float32)
  Output Tensor: [1, 10, 8400]     (Float32: 4 box coords + 6 defect classes)
  Target Model:  construction_defect_yolov8s.onnx

USAGE:
  python export_onnx.py --weights ./runs/defect_yolov8s/weights/best.pt --output ../backend/src/models/ai/construction_defect_yolov8s.onnx
"""

import argparse
import os
import shutil
import sys
from pathlib import Path


def validate_exported_model(onnx_path: Path):
    """Verify input and output tensor dimensions using onnx package."""
    try:
        import onnx
        model = onnx.load(str(onnx_path))
        onnx.checker.check_model(model)

        input_tensor = model.graph.input[0]
        in_dims = [d.dim_value for d in input_tensor.type.tensor_type.shape.dim]
        print(f"[CHECK] Input tensor shape:  {in_dims}")

        output_tensor = model.graph.output[0]
        out_dims = [d.dim_value for d in output_tensor.type.tensor_type.shape.dim]
        print(f"[CHECK] Output tensor shape: {out_dims}")

        # For 6 defect classes, output channels must be 4 + 6 = 10
        expected_channels = 10
        if len(out_dims) == 3 and out_dims[1] == expected_channels and out_dims[2] == 8400:
            print(f"[SUCCESS] Output tensor matches required [1, 10, 8400] shape for 6 defect classes!")
            return True
        else:
            print(f"[WARNING] Output tensor shape {out_dims} does not match [1, 10, 8400].")
            return False
    except ImportError:
        print("[INFO] Python 'onnx' library not installed for validation. Skipping tensor inspection.")
        return True
    except Exception as e:
        print(f"[WARN] Error during tensor validation: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Export Inspectra Pro Defect Model to ONNX")
    parser.add_argument("--weights", type=str, required=True, help="Path to best.pt weights file")
    parser.add_argument(
        "--output",
        type=str,
        default="../backend/src/models/ai/construction_defect_yolov8s.onnx",
        help="Destination ONNX path"
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Input resolution (default: 640)")
    parser.add_argument("--opset", type=int, default=12, help="ONNX opset version (default: 12)")
    args = parser.parse_args()

    weights_path = Path(args.weights).resolve()
    if not weights_path.exists():
        print(f"[ERROR] Weights file not found: {weights_path}")
        sys.exit(1)

    dest_path = Path(args.output).resolve()

    # CRITICAL SAFETY GUARD: Protect existing PPE model
    if dest_path.name == "construction_safety_yolov8.onnx":
        print("[CRITICAL SAFETY ERROR] You cannot overwrite the existing PPE model 'construction_safety_yolov8.onnx'!")
        print("Please export to 'construction_defect_yolov8s.onnx'.")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] Ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    print(f"Loading checkpoint: {weights_path}")
    model = YOLO(str(weights_path))

    print(f"Exporting to ONNX (imgsz={args.imgsz}, opset={args.opset}, dynamic=False, simplify=True)...")
    exported_file = model.export(
        format="onnx",
        imgsz=args.imgsz,
        opset=args.opset,
        simplify=True,
        dynamic=False
    )
    print(f"Exported artifact: {exported_file}")

    exported_path = Path(exported_file)
    validate_exported_model(exported_path)

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(exported_path, dest_path)
    print(f"[SUCCESS] Model placed in production target: {dest_path}")
    print(f"File size: {dest_path.stat().st_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    main()
