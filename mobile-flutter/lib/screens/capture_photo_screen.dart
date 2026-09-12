import 'package:flutter/material.dart';

class CapturePhotoScreen extends StatefulWidget {
  const CapturePhotoScreen({super.key});

  @override
  State<CapturePhotoScreen> createState() => _CapturePhotoScreenState();
}

class _CapturePhotoScreenState extends State<CapturePhotoScreen> {
  bool _photoCaptured = false;
  bool _aiAnalyzing = false;
  Map<String, dynamic>? _aiDetection;

  void _simulateCapture() {
    setState(() {
      _photoCaptured = true;
      _aiAnalyzing = true;
    });

    // Simulate Computer Vision Defect Detection Scan
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _aiAnalyzing = false;
          _aiDetection = {
            'detected': true,
            'label': 'CONCRETE_SPALLING',
            'confidence': '94.2%',
            'severity': 'CRITICAL',
            'recommendation': 'Spalling exceeds 0.3mm threshold. Immediate NDT test suggested.'
          };
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Capture Evidence Photo', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_photoCaptured)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800',
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    )
                  else
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.camera_alt_rounded, color: Color(0xFF64748B), size: 64),
                        SizedBox(height: 12),
                        Text('Camera Viewfinder Preview', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                        SizedBox(height: 4),
                        Text('Tap shutter below to capture timestamped photo', style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                      ],
                    ),

                  // Simulated AI Bounding Box & HUD
                  if (_photoCaptured && _aiDetection != null)
                    Positioned(
                      top: 40,
                      left: 40,
                      right: 40,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A).withOpacity(0.9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.redAccent, width: 1.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: const [
                                    Icon(Icons.auto_awesome, color: Colors.amber, size: 14),
                                    SizedBox(width: 4),
                                    Text('AI VISION DETECTION', style: TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(4)),
                                  child: const Text('CRITICAL', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('${_aiDetection!['label']} (${_aiDetection!['confidence']})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 2),
                            Text(_aiDetection!['recommendation'], style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 10)),
                          ],
                        ),
                      ),
                    ),

                  if (_aiAnalyzing)
                    Container(
                      color: Colors.black54,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            CircularProgressIndicator(color: Color(0xFF38BDF8)),
                            SizedBox(height: 12),
                            Text('Running Computer Vision Scan...', style: TextStyle(color: Colors.white, fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.flash_on_outlined, color: Colors.white70),
                  onPressed: () {},
                ),
                GestureDetector(
                  onTap: _simulateCapture,
                  child: Container(
                    height: 72,
                    width: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 4),
                      color: const Color(0xFF0284C7),
                    ),
                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 30),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.check_circle_outline, color: Color(0xFF10B981)),
                  onPressed: _photoCaptured ? () => Navigator.pop(context) : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
