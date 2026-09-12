import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Target production public API by default, configurable at build time via --dart-define=API_BASE_URL=...
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://backend-three-gules-87.vercel.app/api',
  );

  static String? _authToken;
  static Map<String, dynamic>? _currentUser;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('jwt_token');
    final userRaw = prefs.getString('user_data');
    if (userRaw != null) {
      try {
        _currentUser = jsonDecode(userRaw);
      } catch (e) {}
    }
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  static Map<String, dynamic>? get currentUser => _currentUser;
  static String? get userRole => _currentUser?['role'];

  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'username': identifier,
        'email': identifier,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      _authToken = data['data']['token'];
      _currentUser = data['data']['user'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', _authToken!);
      await prefs.setString('user_data', jsonEncode(_currentUser));
    }
    return data;
  }

  static Future<List<dynamic>> getSites() async {
    final response = await http.get(Uri.parse('$baseUrl/sites'), headers: _headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> getChecklists({String? category}) async {
    final uri = category != null
        ? Uri.parse('$baseUrl/checklists?category=$category')
        : Uri.parse('$baseUrl/checklists');
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return {'success': false, 'data': []};
  }

  static Future<Map<String, dynamic>> detectYolo(String base64Image) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/yolo/detect'),
      headers: _headers,
      body: jsonEncode({
        'image': base64Image,
        'conf_threshold': 0.25,
        'source': 'FLUTTER_MOBILE_INSPECTOR'
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> verifyDetection({
    required String detectionId,
    required String className,
    required double confidence,
    required bool isCorrect,
    String? feedback,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/verify'),
      headers: _headers,
      body: jsonEncode({
        'detection_id': detectionId,
        'class_name': className,
        'confidence': confidence,
        'is_correct': isCorrect,
        'feedback': feedback ?? (isCorrect ? 'Confirmed' : 'False Positive'),
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> verifyQrCode(String qrCode) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sites/verify-qr'),
      headers: _headers,
      body: jsonEncode({'qr_code': qrCode}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> submitInspection(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/inspections/submit'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> verifyGeofence(String siteId, double lat, double lng) async {
    final response = await http.post(
      Uri.parse('$baseUrl/gps/verify-geofence'),
      headers: _headers,
      body: jsonEncode({'site_id': siteId, 'lat': lat, 'lng': lng}),
    );
    return jsonDecode(response.body);
  }

  static Future<List<dynamic>> getLiveShareRequests() async {
    final response = await http.get(Uri.parse('$baseUrl/live-share/requests'), headers: _headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> respondLiveShare(String requestId, String status) async {
    final response = await http.post(
      Uri.parse('$baseUrl/live-share/respond'),
      headers: _headers,
      body: jsonEncode({'request_id': requestId, 'status': status}),
    );
    return jsonDecode(response.body);
  }

  static Future<void> logout() async {
    _authToken = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_data');
  }
}
