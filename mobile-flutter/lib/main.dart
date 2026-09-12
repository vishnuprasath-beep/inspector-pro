import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/site_selection_screen.dart';
import 'screens/checklist_screen.dart';
import 'screens/capture_photo_screen.dart';
import 'screens/gps_verification_screen.dart';
import 'screens/defect_reporting_screen.dart';
import 'screens/inspection_summary_screen.dart';
import 'screens/offline_sync_screen.dart';
import 'screens/history_screen.dart';
import 'screens/profile_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(const InspectraApp());
}

class InspectraApp extends StatelessWidget {
  const InspectraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Inspectra Pro - Enterprise Mobile Inspector',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF0284C7),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF0284C7),
          secondary: Color(0xFF38BDF8),
          surface: Color(0xFF1E293B),
        ),
        fontFamily: 'Segoe UI',
      ),
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/site_selection': (context) => const SiteSelectionScreen(),
        '/checklist': (context) => const ChecklistScreen(),
        '/capture_photo': (context) => const CapturePhotoScreen(),
        '/gps_verification': (context) => const GpsVerificationScreen(),
        '/defect_reporting': (context) => const DefectReportingScreen(),
        '/inspection_summary': (context) => const InspectionSummaryScreen(),
        '/offline_sync': (context) => const OfflineSyncScreen(),
        '/history': (context) => const HistoryScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}
