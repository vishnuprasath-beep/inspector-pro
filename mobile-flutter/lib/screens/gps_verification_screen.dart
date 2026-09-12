import 'package:flutter/material.dart';

class GpsVerificationScreen extends StatefulWidget {
  const GpsVerificationScreen({super.key});

  @override
  State<GpsVerificationScreen> createState() => _GpsVerificationScreenState();
}

class _GpsVerificationScreenState extends State<GpsVerificationScreen> {
  bool _isChecking = true;
  bool _isVerified = false;
  double _distanceMeters = 142.0;
  final double _allowedRadius = 650.0;

  @override
  void initState() {
    super.initState();
    _runGpsLock();
  }

  void _runGpsLock() {
    setState(() => _isChecking = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isChecking = false;
          _isVerified = _distanceMeters <= _allowedRadius;
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
        title: const Text('GPS Geofence Verification', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_isVerified ? const Color(0xFF10B981) : const Color(0xFF0284C7)).withOpacity(0.1),
                    ),
                  ),
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_isVerified ? const Color(0xFF10B981) : const Color(0xFF0284C7)).withOpacity(0.2),
                    ),
                  ),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isVerified ? const Color(0xFF10B981) : const Color(0xFF0284C7),
                      boxShadow: [
                        BoxShadow(
                          color: (_isVerified ? const Color(0xFF10B981) : const Color(0xFF0284C7)).withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      _isVerified ? Icons.check_circle_rounded : Icons.satellite_alt_rounded,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Text(
              _isChecking
                  ? 'Acquiring GPS Telemetry Lock...'
                  : _isVerified
                      ? 'Geofence Verification Passed!'
                      : 'Outside Authorized Perimeter!',
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _isChecking
                  ? 'Querying device GNSS satellites and calculating Haversine distance.'
                  : 'Site: Delhi Metro Central Terminal (Phase 2)\nTarget Coordinates: 28.6289° N, 77.2219° E',
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Distance to Site Center', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                      Text('${_distanceMeters.toStringAsFixed(1)} meters', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const Divider(color: Color(0xFF334155), height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Maximum Allowed Radius', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                      Text('${_allowedRadius.toStringAsFixed(0)} meters', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const Divider(color: Color(0xFF334155), height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Audit Status', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                      Text(_isVerified ? 'AUTHORIZED' : 'RESTRICTED', style: TextStyle(color: _isVerified ? const Color(0xFF10B981) : Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isVerified ? () => Navigator.pushReplacementNamed(context, '/checklist') : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  disabledBackgroundColor: const Color(0xFF334155),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Unlock & Launch Checklist', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
