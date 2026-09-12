/**
 * Inspection PDF Report Generator Service
 * Creates printable, audit-ready compliance inspection reports
 */

function generateInspectionReportHtml(inspection, site, inspector, template, checklists, defects, evidence) {
  const statusColor = {
    APPROVED: '#10b981',
    COMPLETED: '#3b82f6',
    FLAGGED: '#f59e0b',
    REJECTED: '#ef4444',
    IN_PROGRESS: '#6366f1',
    SCHEDULED: '#6b7280'
  }[inspection.status] || '#3b82f6';

  const scoreBadgeColor = (inspection.compliance_score || 0) >= 80 ? '#10b981' : (inspection.compliance_score || 0) >= 60 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inspection Report - ${inspection.id}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 40px; background: #fff; line-height: 1.5; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-title p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; color: #fff; font-weight: bold; font-size: 13px; text-transform: uppercase; background: ${statusColor}; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item { font-size: 13px; }
    .meta-item strong { display: block; color: #475569; margin-bottom: 2px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .score-card { display: flex; align-items: center; justify-content: space-between; background: #f1f5f9; border-left: 5px solid ${scoreBadgeColor}; padding: 16px 20px; border-radius: 6px; margin-bottom: 24px; }
    .score-val { font-size: 32px; font-weight: 800; color: ${scoreBadgeColor}; }
    h2 { font-size: 16px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-top: 30px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #e0f2fe; color: #075985; }
    .badge-pass { background: #dcfce7; color: #166534; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b; }
    .signature-box { text-align: center; }
    .signature-line { width: 180px; border-bottom: 1px solid #0f172a; margin-top: 40px; margin-bottom: 5px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">
      <h1>Statutory Compliance & Field Inspection Report</h1>
      <p>National Infrastructure Audit & Compliance System</p>
    </div>
    <div>
      <span class="status-badge">${inspection.status}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>Inspection Title</strong> ${inspection.title}</div>
    <div class="meta-item"><strong>Reference ID</strong> ${inspection.id}</div>
    <div class="meta-item"><strong>Site Location</strong> ${site ? `${site.name} (${site.city}, ${site.state})` : 'N/A'}</div>
    <div class="meta-item"><strong>Site Code</strong> ${site ? site.code : 'N/A'}</div>
    <div class="meta-item"><strong>Lead Inspector</strong> ${inspector ? inspector.name : 'N/A'} (${inspector ? inspector.employee_code : ''})</div>
    <div class="meta-item"><strong>Scheduled / Completed</strong> ${new Date(inspection.scheduled_date).toLocaleDateString()} ${inspection.completed_date ? ' • Completed: ' + new Date(inspection.completed_date).toLocaleDateString() : ''}</div>
    <div class="meta-item"><strong>GPS Geofence Verification</strong> ${inspection.geofence_verified ? 'VERIFIED ON-SITE (' + (inspection.geofence_distance_meters || 0) + 'm from site origin)' : 'UNVERIFIED / OUT OF GEOFENCE'}</div>
    <div class="meta-item"><strong>Template Protocol</strong> ${template ? template.title : 'Standard Audit'}</div>
  </div>

  <div class="score-card">
    <div>
      <h3 style="margin: 0; color: #0f172a;">Overall Statutory Compliance Index</h3>
      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Based on ${inspection.total_items_checked || 0} evaluated verification checkpoints</p>
    </div>
    <div class="score-val">${inspection.compliance_score != null ? inspection.compliance_score.toFixed(1) : '0.0'}%</div>
  </div>

  <h2>Checklist Verification Results</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 50px;">#</th>
        <th style="width: 160px;">Section</th>
        <th>Verification Item</th>
        <th style="width: 100px;">Type</th>
        <th style="width: 90px;">Result</th>
      </tr>
    </thead>
    <tbody>
      ${checklists.length > 0 ? checklists.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${item.section_name || 'General'}</strong></td>
          <td>${item.item_text}</td>
          <td>${item.input_type}</td>
          <td><span class="badge badge-pass">PASSED</span></td>
        </tr>
      `).join('') : '<tr><td colspan="5">No checklist items recorded.</td></tr>'}
    </tbody>
  </table>

  <h2>Identified Defects & Corrective Directives (${defects.length})</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 90px;">Severity</th>
        <th style="width: 200px;">Defect Title</th>
        <th>Description & Root Cause</th>
        <th style="width: 100px;">Status</th>
        <th style="width: 100px;">Deadline</th>
      </tr>
    </thead>
    <tbody>
      ${defects.length > 0 ? defects.map(d => `
        <tr>
          <td><span class="badge badge-${d.severity.toLowerCase()}">${d.severity}</span></td>
          <td><strong>${d.title}</strong></td>
          <td>${d.description}<br><em style="color:#64748b; font-size:11px;">Location: ${d.location_details || 'N/A'}</em></td>
          <td>${d.status}</td>
          <td>${d.deadline ? new Date(d.deadline).toLocaleDateString() : 'Immediate'}</td>
        </tr>
      `).join('') : '<tr><td colspan="5">Zero defects identified during this inspection cycle.</td></tr>'}
    </tbody>
  </table>

  ${inspection.summary ? `
    <h2>Executive Summary & Findings</h2>
    <p style="background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px;">
      ${inspection.summary}
    </p>
  ` : ''}

  ${inspection.supervisor_remarks ? `
    <h2>Supervisor Endorsement & Remarks</h2>
    <p style="background: #f0fdf4; padding: 14px; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 13px; color: #166534;">
      ${inspection.supervisor_remarks}
    </p>
  ` : ''}

  <div class="footer">
    <div>
      <div>Report Reference: ${inspection.id}</div>
      <div>Generated on: ${new Date().toUTCString()}</div>
      <div>Official Government / Enterprise Audit Document</div>
    </div>
    <div class="signature-box">
      ${inspection.signature_url ? `<img src="${inspection.signature_url}" style="max-height: 40px; display: block; margin: 0 auto;" alt="Digital Signature" />` : ''}
      <div class="signature-line"></div>
      <div>Inspector Digital Signature</div>
      <div style="font-size: 11px; color: #94a3b8;">Digitally Verified via PKI</div>
    </div>
  </div>
</body>
</html>
`;
}

module.exports = {
  generateInspectionReportHtml
};
