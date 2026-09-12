import 'package:flutter/material.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});

  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  final List<Map<String, dynamic>> _items = [
    {
      'id': 'chk-01',
      'section': 'Structural Integrity',
      'title': 'Inspect load-bearing piers and columns for cracks or spalling',
      'criteria': 'No cracks exceeding 0.3mm width or exposed rebar.',
      'status': 'PASS',
      'notes': 'Sound concrete surface verified.',
    },
    {
      'id': 'chk-02',
      'section': 'Structural Integrity',
      'title': 'Expansion joint seal integrity and alignment check',
      'criteria': 'Elastomeric seals intact with no debris jams.',
      'status': 'PASS',
      'notes': 'Seals in good order.',
    },
    {
      'id': 'chk-03',
      'section': 'Life & Fire Safety',
      'title': 'Emergency egress routes unobstructed & luminous exit signage functional',
      'criteria': 'Clear width maintained with working battery backup signs.',
      'status': 'FAIL',
      'notes': 'Temporary storage pallets blocking East egress corridor.',
    },
    {
      'id': 'chk-04',
      'section': 'Life & Fire Safety',
      'title': 'Fire suppression hydrants and dry riser pressure verification',
      'criteria': 'Minimum 4.5 bar dynamic static pressure at top outlet.',
      'status': 'PASS',
      'notes': 'Manometer measured 4.8 bar.',
    },
    {
      'id': 'chk-05',
      'section': 'Environmental Compliance',
      'title': 'Drainage sumps, runoff channels, and oil-water separators',
      'criteria': 'Free flowing without heavy sludge or environmental sheen.',
      'status': 'PASS',
      'notes': 'Normal flow observed.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    int passCount = _items.filter((i) => i['status'] == 'PASS').length;
    double complianceScore = (_items.isNotEmpty) ? (passCount / _items.length) * 100 : 0;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Inspection Checklist', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.camera_alt_outlined, color: Color(0xFF38BDF8)),
            onPressed: () => Navigator.pushNamed(context, '/capture_photo'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Live Compliance Score Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFF1E293B),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ESTIMATED COMPLIANCE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                    Text('${complianceScore.toStringAsFixed(0)}% Score', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                      child: Text('$passCount PASS', style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                      child: Text('${_items.length - passCount} FAIL', style: const TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _items.length,
              itemBuilder: (context, idx) {
                final item = _items[idx];
                final isPass = item['status'] == 'PASS';

                return Card(
                  color: const Color(0xFF1E293B),
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: isPass ? const Color(0xFF334155) : Colors.redAccent.withOpacity(0.4)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['section'].toUpperCase(), style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 9, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(item['title'], style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Criteria: ${item['criteria']}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                ChoiceChip(
                                  label: const Text('PASS', style: TextStyle(fontSize: 11)),
                                  selected: isPass,
                                  selectedColor: const Color(0xFF10B981),
                                  onSelected: (val) {
                                    setState(() => item['status'] = 'PASS');
                                  },
                                ),
                                const SizedBox(width: 8),
                                ChoiceChip(
                                  label: const Text('FAIL', style: TextStyle(fontSize: 11)),
                                  selected: !isPass,
                                  selectedColor: Colors.redAccent,
                                  onSelected: (val) {
                                    setState(() => item['status'] = 'FAIL');
                                  },
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_a_photo_outlined, color: Color(0xFF94A3B8), size: 20),
                              onPressed: () => Navigator.pushNamed(context, '/capture_photo'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/inspection_summary'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Proceed to Inspection Summary', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension IterableExtension<T> on Iterable<T> {
  Iterable<T> filter(bool Function(T) test) => where(test);
}
