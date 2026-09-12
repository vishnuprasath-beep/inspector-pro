import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            const CircleAvatar(
              radius: 18,
              backgroundImage: NetworkImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Rajesh Sharma', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                Text('ID: INSP-CIV-001 • ON DUTY', style: TextStyle(fontSize: 10, color: Color(0xFF38BDF8))),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded, color: Color(0xFF94A3B8)),
            onPressed: () => Navigator.pushNamed(context, '/offline_sync'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: Color(0xFF94A3B8)),
            onPressed: () => Navigator.pushNamed(context, '/profile'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quick Status Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF0284C7).withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 6)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('TODAY\'S ASSIGNMENT', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                        child: const Text('GEOFENCE ACTIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('Delhi Metro Terminal (Phase 2)', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Barakhamba Road • 5 Checkpoints Required', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/gps_verification'),
                    icon: const Icon(Icons.location_on_outlined, size: 18, color: Color(0xFF0369A1)),
                    label: const Text('Verify GPS & Begin Audit', style: TextStyle(color: Color(0xFF0369A1), fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Inspector Metrics', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatTile('2', 'Assigned Sites', Icons.business_outlined, const Color(0xFF38BDF8)),
                const SizedBox(width: 12),
                _buildStatTile('94.8%', 'Compliance Avg', Icons.verified_outlined, const Color(0xFF10B981)),
                const SizedBox(width: 12),
                _buildStatTile('0', 'Pending Sync', Icons.cloud_done_outlined, const Color(0xFFF59E0B)),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Quick Actions', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildNavTile(
              context,
              'Select Facility / Route',
              'Browse all 5 national infrastructure project sites',
              Icons.map_outlined,
              '/site_selection',
            ),
            _buildNavTile(
              context,
              'Report Standalone Defect',
              'Log critical safety hazard with camera capture',
              Icons.warning_amber_rounded,
              '/defect_reporting',
            ),
            _buildNavTile(
              context,
              'Audit History',
              'Review previously completed inspection records',
              Icons.history_rounded,
              '/history',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatTile(String val, String label, IconData icon, Color col) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: col, size: 22),
            const SizedBox(height: 8),
            Text(val, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile(BuildContext context, String title, String subtitle, IconData icon, String route) {
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: const Color(0xFF334155), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: const Color(0xFF38BDF8), size: 24),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF64748B), size: 16),
        onTap: () => Navigator.pushNamed(context, route),
      ),
    );
  }
}
