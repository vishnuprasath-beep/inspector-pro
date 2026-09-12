import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineDatabase {
  static const String _queueKey = 'offline_inspection_queue';

  static Future<void> queueInspection(Map<String, dynamic> inspectionPayload) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> currentQueue = prefs.getStringList(_queueKey) ?? [];
    currentQueue.add(jsonEncode(inspectionPayload));
    await prefs.setStringList(_queueKey, currentQueue);
  }

  static Future<List<Map<String, dynamic>>> getQueuedInspections() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> currentQueue = prefs.getStringList(_queueKey) ?? [];
    return currentQueue.map((item) => jsonDecode(item) as Map<String, dynamic>).toList();
  }

  static Future<void> clearQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
  }

  static Future<int> getPendingSyncCount() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> currentQueue = prefs.getStringList(_queueKey) ?? [];
    return currentQueue.length;
  }
}
