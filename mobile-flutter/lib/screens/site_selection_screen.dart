import 'package:flutter/material.dart';

class SiteSelectionScreen extends StatelessWidget {
  const SiteSelectionScreen({super.key});

  final List<Map<String, dynamic>> sites = const [
    {
      'id': 'site-01',
      'name': 'Delhi Metro Central Terminal (Phase 2)',
      'code': 'DEL-MET-02',
      'type': 'Transit Infrastructure',
      'city': 'New Delhi',
      'radius': '650m Geofence',
      'distance': '140m away',
      'inGeofence': true,
    },
    {
      'id': 'site-02',
      'name': 'Bhadla Solar Power Ultra Park (Sector 4)',
      'code': 'RAJ-SOL-04',
      'type': 'Renewable Energy',
      'city': 'Jodhpur, Rajasthan',
      'radius': '1200m Geofence',
      'distance': '2.1km away',
      'inGeofence': false,
    },
    {
      'id': 'site-03',
      'name': 'Smart City Water Treatment Plant',
      'code': 'BHO-WTP-01',
      'type': 'Municipal Water Utility',
      'city': 'Bhopal, MP',
      'radius': '500m Geofence',
      'distance': '95m away',
      'inGeofence': true,
    },
    {
      'id': 'site-04',
      'name': 'Cyber Innovation Tech Park Block C',
      'code': 'BLR-TEC-03',
      'type': 'Commercial Smart Facility',
      'city': 'Bengaluru, Karnataka',
      'radius': '450m Geofence',
      'distance': '45m away',
      'inGeofence': true,
    },
    {
      'id': 'site-05',
      'name': 'NH-44 Highway Overpass Bridge',
      'code': 'NAG-NH-044',
      'type': 'Highway Infrastructure',
      'city': 'Nagpur, Maharashtra',
      'radius': '800m Geofence',
      'distance': '180m away',
      'inGeofence': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Select Inspection Site', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sites.length,
        itemBuilder: (context, index) {
          final s = sites[index];
          return Card(
            color: const Color(0xFF1E293B),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: s['inGeofence'] ? const Color(0xFF10B981).withOpacity(0.4) : const Color(0xFF334155),
              ),
            ),
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: const Color(0xFF0284C7).withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                        child: Text(s['code'], style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      Row(
                        children: [
                          Icon(
                            s['inGeofence'] ? Icons.check_circle : Icons.warning_amber_rounded,
                            color: s['inGeofence'] ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            s['inGeofence'] ? 'WITHIN GEOFENCE' : 'OUTSIDE BOUNDS',
                            style: TextStyle(
                              color: s['inGeofence'] ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(s['name'], style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('${s['city']} • ${s['type']}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Distance: ${s['distance']} (${s['radius']})', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                      ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/gps_verification'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        ),
                        child: const Text('Start Audit', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
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
