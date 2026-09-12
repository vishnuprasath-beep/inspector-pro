import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InspectionSummaryScreen extends StatefulWidget {
  const InspectionSummaryScreen({super.key});

  @override
  State<InspectionSummaryScreen> createState() => _InspectionSummaryScreenState();
}

class _InspectionSummaryScreenState extends State<InspectionSummaryScreen> {
  bool _signed = true;
  bool _isSubmitting = false;

  void _handleSubmit() async {
    setState(() => _isSubmitting = true);

    try {
      await ApiService.submitInspection({
        'template_id': 'tpl-01',
        'site_id': 'site-01',
        'inspector_id': 'insp-01',
        'title': 'Delhi Metro Terminal (Phase 2) Field Audit',
        'gps_lat': 28.6289,
        'gps_lng': 77.2219,
        'checklist_results': [
          {'passed': true},
          {'passed': true},
          {'passed': false},
          {'passed': true},
          {'passed': true},
        ],
        'signature_url': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M10 20 Q 30 5, 60 25 T 90 10" fill="none" stroke="blue" stroke-width="2"/></svg>',
        'summary': 'Inspection conducted with 4/5 items verified and 1 critical defect flagged.'
      });
    } catch (e) {
      // In demo offline mode, proceed
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Inspection Submitted!', style: TextStyle(color: Colors.white)),
          content: const Text(
            'Compliance score calculated: 80.0%\nGeofence verified on-site.\nAudit log generated successfully.',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pushReplacementNamed(context, '/dashboard');
              },
              child: const Text('Return to Dashboard'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Inspection Summary', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('FINAL COMPLIANCE RATING', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('80.0% Passed', style: TextStyle(color: Color(0xFF10B981), fontSize: 22, fontWeight: FontWeight.bold)),
                      Text('4 of 5 Checkpoints Cleared', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.15), shape: BoxShape.circle),
                    child: const Icon(Icons.shield_rounded, color: Color(0xFF10B981), size: 36),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Audited Site & GPS Verification', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(10)),
              child: Row(
                children: const [
                  Icon(Icons.location_on, color: Color(0xFF10B981), size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Delhi Metro Terminal (Phase 2) • 142m inside geofence perimeter', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Flagged Defects', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
              ),
              child: Row(
                children: const [
                  Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('1 CRITICAL: Pallets blocking fire exit corridor #3', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Inspector Digital Signature', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Center(
                child: Text(
                  _signed ? 'Rajesh Sharma ~ [PKI Signed 2024-03-10]' : 'Draw signature here',
                  style: const TextStyle(
                    fontFamily: 'cursive',
                    color: Color(0xFF38BDF8),
                    fontSize: 20,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Submit Final Field Report', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
