import 'package:flutter/material.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  final List<Map<String, dynamic>> _inspections = const [
    {
      'id': 'insp-rec-01',
      'site': 'Delhi Metro Terminal (Phase 2)',
      'date': '2024-03-01',
      'score': '92.5%',
      'status': 'COMPLETED',
      'defects': 0,
    },
    {
      'id': 'insp-rec-02',
      'site': 'NH-44 Overpass Pier 14',
      'date': '2024-03-02',
      'score': '64.0%',
      'status': 'FLAGGED',
      'defects': 2,
    },
    {
      'id': 'insp-rec-03',
      'site': 'Bhadla Solar Sector 4 Substation',
      'date': '2024-03-03',
      'score': '98.0%',
      'status': 'APPROVED',
      'defects': 0,
    },
    {
      'id': 'insp-rec-04',
      'site': 'Bhopal Water Treatment Hall',
      'date': '2024-03-04',
      'score': '78.5%',
      'status': 'COMPLETED',
      'defects': 1,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Inspection History', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _inspections.length,
        itemBuilder: (context, index) {
          final item = _inspections[index];
          final isApproved = item['status'] == 'APPROVED' || item['status'] == 'COMPLETED';

          return Card(
            color: const Color(0xFF1E293B),
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF334155))),
            child: ListTile(
              contentPadding: const EdgeInsets.all(14),
              title: Text(item['site'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text('Audit Date: ${item['date']} • ${item['defects']} Defect(s)', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(item['score'], style: TextStyle(color: isApproved ? const Color(0xFF10B981) : Colors.amber, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isApproved ? const Color(0xFF10B981).withOpacity(0.15) : Colors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(item['status'], style: TextStyle(color: isApproved ? const Color(0xFF10B981) : Colors.amber, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
