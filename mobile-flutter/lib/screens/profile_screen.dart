import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Inspector Profile', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Center(
              child: CircleAvatar(
                radius: 44,
                backgroundImage: NetworkImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Rajesh Sharma', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const Text('ID: INSP-CIV-001 • Civil & Structural Auditor', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12)),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: const [
                  _ProfileRow('Email', 'rajesh.sharma@inspection.gov.in'),
                  Divider(color: Color(0xFF334155), height: 20),
                  _ProfileRow('Official Contact', '+91 98230 11001'),
                  Divider(color: Color(0xFF334155), height: 20),
                  _ProfileRow('Qualifications', 'B.Tech Civil, NDT Level II Certified'),
                  Divider(color: Color(0xFF334155), height: 20),
                  _ProfileRow('Role & Access', 'FIELD_INSPECTOR (RBAC Level 1)'),
                ],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ApiService.logout();
                  Navigator.pushNamedAndRemoveUntil(context, '/login', (r) => false);
                },
                icon: const Icon(Icons.logout, color: Colors.redAccent),
                label: const Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.redAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final String label;
  final String val;
  const _ProfileRow(this.label, this.val);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
        Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
      ],
    );
  }
}
