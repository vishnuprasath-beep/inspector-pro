const db = require('../config/db');
const { TABLES } = require('../models/schema');
const { streamInspectionPdf, generateInspectionReportHtml } = require('../services/pdfService');

/**
 * Generate and Stream Printable PDF Report for Inspection
 */
async function generateInspectionPdfReport(req, res) {
  try {
    const { id } = req.params;
    const inspection = db.getById(TABLES.INSPECTIONS, id);

    if (!inspection) {
      return res.status(404).json({ success: false, error: 'Inspection not found.' });
    }

    const site = db.getById(TABLES.SITES, inspection.site_id);
    const inspector = db.getById(TABLES.INSPECTORS, inspection.inspector_id);
    const inspectorUser = inspector ? db.getById(TABLES.USERS, inspector.user_id) : null;
    const template = db.getById(TABLES.INSPECTION_TEMPLATES, inspection.template_id);
    const checklists = db.find(TABLES.CHECKLISTS, { template_id: inspection.template_id });
    const defects = db.find(TABLES.DEFECTS, { inspection_id: inspection.id });
    const evidence = db.find(TABLES.INSPECTION_EVIDENCE, { inspection_id: inspection.id });

    const inspectorPayload = {
      name: inspectorUser ? inspectorUser.name : (inspector ? inspector.name : 'Authorized Inspector'),
      employee_code: inspector ? inspector.employee_code : 'INSP-AUTH'
    };

    if (req.query.format === 'html') {
      const htmlContent = generateInspectionReportHtml(
        inspection,
        site,
        inspectorPayload,
        template,
        checklists,
        defects,
        evidence
      );
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="Inspection-Report-${inspection.id}.html"`);
      return res.send(htmlContent);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Inspection-Report-${inspection.id}.pdf"`);
    streamInspectionPdf(
      inspection,
      site,
      inspectorPayload,
      template,
      checklists,
      defects,
      evidence,
      res
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Export Inspections or Defects as CSV
 */
async function exportCsv(req, res) {
  try {
    const { type = 'inspections' } = req.query;

    if (type === 'defects') {
      const defects = db.getAll(TABLES.DEFECTS);
      const inspections = db.getAll(TABLES.INSPECTIONS);
      const sites = db.getAll(TABLES.SITES);

      let csv = 'Defect ID,Title,Severity,Status,Site,Deadline,Created Date\n';
      defects.forEach(d => {
        const insp = inspections.find(i => i.id === d.inspection_id) || {};
        const site = sites.find(s => s.id === insp.site_id) || {};
        const cleanTitle = `"${(d.title || 'Untitled').replace(/"/g, '""')}"`;
        const siteName = `"${(site.name || 'N/A').replace(/"/g, '""')}"`;
        csv += `${d.id},${cleanTitle},${d.severity},${d.status},${siteName},${d.deadline || ''},${d.created_at}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="defects_export.csv"');
      return res.send(csv);
    }

    // Default: Inspections CSV
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const sites = db.getAll(TABLES.SITES);
    const inspectors = db.getAll(TABLES.INSPECTORS);
    const users = db.getAll(TABLES.USERS);

    let csv = 'Inspection ID,Title,Site Code,Site Name,Inspector Name,Scheduled Date,Status,Compliance Score,Geofence Verified\n';
    inspections.forEach(i => {
      const site = sites.find(s => s.id === i.site_id) || {};
      const insp = inspectors.find(ins => ins.id === i.inspector_id) || {};
      const user = users.find(u => u.id === insp.user_id) || {};

      const title = `"${(i.title || 'Untitled').replace(/"/g, '""')}"`;
      const siteName = `"${(site.name || '').replace(/"/g, '""')}"`;
      const inspName = `"${(user.name || '').replace(/"/g, '""')}"`;

      csv += `${i.id},${title},${site.code || ''},${siteName},${inspName},${i.scheduled_date},${i.status},${i.compliance_score || 0}%,${i.geofence_verified ? 'YES' : 'NO'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inspections_export.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Statutory Compliance Summary Report Data
 */
async function getComplianceReport(req, res) {
  try {
    const inspections = db.getAll(TABLES.INSPECTIONS);
    const defects = db.getAll(TABLES.DEFECTS);
    const sites = db.getAll(TABLES.SITES);

    const completed = inspections.filter(i => i.status === 'COMPLETED' || i.status === 'APPROVED');
    const totalScore = completed.reduce((sum, i) => sum + (i.compliance_score || 0), 0);

    const criticalCount = defects.filter(d => d.severity === 'CRITICAL').length;
    const resolvedCount = defects.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length;

    res.json({
      success: true,
      data: {
        reportGeneratedAt: new Date().toISOString(),
        overallNationalComplianceScore: completed.length > 0 ? (totalScore / completed.length).toFixed(1) : '85.0',
        totalFacilitiesAudited: sites.length,
        totalAuditsExecuted: inspections.length,
        criticalDefectsIdentified: criticalCount,
        resolvedRemediationsCount: resolvedCount,
        remediationEfficiencyPercentage: defects.length > 0 ? Math.round((resolvedCount / defects.length) * 100) : 100,
        statutoryRegulatoryStandard: 'IS-456:2000 / CEA Grid Regulations / NFPA 101'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  generateInspectionPdfReport,
  exportCsv,
  getComplianceReport
};
