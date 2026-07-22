const express = require('express');
const { query, queryOne, queryAll } = require('../config/database');
const { body, param, query: queryValidator, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/records
// @desc    Get all medical records with filtering
// @access  Private
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  queryValidator('patientId').optional().isInt(),
  queryValidator('severity').optional().isString(),
  queryValidator('synced').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const patientId = req.query.patientId;
    const severity = req.query.severity;
    const synced = req.query.synced;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (patientId) {
      paramCount++;
      whereClause += ` AND mr.patient_id = $${paramCount}`;
      params.push(patientId);
    }

    if (severity) {
      paramCount++;
      whereClause += ` AND mr.severity = $${paramCount}`;
      params.push(severity);
    }

    if (synced !== undefined) {
      paramCount++;
      whereClause += ` AND mr.is_synced = $${paramCount}`;
      params.push(synced === 'true');
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM medical_records mr ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get records
    paramCount++;
    const recordsQuery = `
      SELECT 
        mr.id, mr.record_id, mr.patient_id, mr.provider_id, mr.facility_id,
        mr.diagnosis, mr.severity, mr.symptoms, mr.clinical_observations,
        mr.medications, mr.visit_date, mr.next_visit_date,
        mr.is_synced, mr.synced_at, mr.created_at, mr.updated_at,
        p.patient_id as patient_code,
        p.full_name as patient_name,
        u.full_name as provider_name,
        f.name as facility_name
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN users u ON mr.provider_id = u.id
      LEFT JOIN facilities f ON mr.facility_id = f.id
      ${whereClause}
      ORDER BY mr.visit_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const records = await queryAll(recordsQuery, params);

    res.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching records' });
  }
});

// @route   GET /api/records/:id
// @desc    Get single medical record by ID
// @access  Private
router.get('/:id', [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const recordId = parseInt(req.params.id);

    const record = await queryOne(`
      SELECT 
        mr.*,
        p.patient_id as patient_code,
        p.full_name as patient_name,
        u.full_name as provider_name,
        f.name as facility_name
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN users u ON mr.provider_id = u.id
      LEFT JOIN facilities f ON mr.facility_id = f.id
      WHERE mr.id = $1
    `, [recordId]);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching record' });
  }
});

// @route   POST /api/records
// @desc    Create new medical record
// @access  Private
router.post('/', [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('severity').optional().isString(),
  body('symptoms').optional().isArray(),
  body('visitDate').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      patientId,
      providerId,
      facilityId,
      diagnosis,
      severity,
      symptoms,
      clinicalObservations,
      medications,
      visitDate,
      nextVisitDate,
      isSynced = false
    } = req.body;

    // Verify patient exists
    const patient = await queryOne('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Generate record ID
    const recordId = `MR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get facility ID if not provided
    let finalFacilityId = facilityId;
    if (!finalFacilityId) {
      const facility = await queryOne('SELECT id FROM facilities LIMIT 1');
      finalFacilityId = facility?.id;
    }

    const result = await query(`
      INSERT INTO medical_records (
        record_id, patient_id, provider_id, facility_id, diagnosis, severity,
        symptoms, clinical_observations, medications, visit_date, next_visit_date, is_synced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, record_id, patient_id, diagnosis, severity, visit_date, is_synced, created_at
    `, [
      recordId, patientId, providerId, finalFacilityId, diagnosis, severity,
      symptoms, clinicalObservations, medications ? JSON.stringify(medications) : null,
      visitDate || new Date(), nextVisitDate, isSynced
    ]);

    const record = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: record
    });

  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ success: false, message: 'Server error creating record' });
  }
});

// @route   PUT /api/records/:id
// @desc    Update medical record
// @access  Private
router.put('/:id', [
  param('id').isInt(),
  body('diagnosis').optional().notEmpty(),
  body('severity').optional().isString(),
  body('symptoms').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const recordId = parseInt(req.params.id);
    const {
      diagnosis,
      severity,
      symptoms,
      clinicalObservations,
      medications,
      nextVisitDate,
      isSynced,
      syncedAt
    } = req.body;

    // Check if record exists
    const existingRecord = await queryOne('SELECT id FROM medical_records WHERE id = $1', [recordId]);
    if (!existingRecord) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (diagnosis !== undefined) { paramCount++; updateFields.push(`diagnosis = $${paramCount}`); updateValues.push(diagnosis); }
    if (severity !== undefined) { paramCount++; updateFields.push(`severity = $${paramCount}`); updateValues.push(severity); }
    if (symptoms !== undefined) { paramCount++; updateFields.push(`symptoms = $${paramCount}`); updateValues.push(symptoms); }
    if (clinicalObservations !== undefined) { paramCount++; updateFields.push(`clinical_observations = $${paramCount}`); updateValues.push(clinicalObservations); }
    if (medications !== undefined) { paramCount++; updateFields.push(`medications = $${paramCount}`); updateValues.push(JSON.stringify(medications)); }
    if (nextVisitDate !== undefined) { paramCount++; updateFields.push(`next_visit_date = $${paramCount}`); updateValues.push(nextVisitDate); }
    if (isSynced !== undefined) { paramCount++; updateFields.push(`is_synced = $${paramCount}`); updateValues.push(isSynced); }
    if (syncedAt !== undefined) { paramCount++; updateFields.push(`synced_at = $${paramCount}`); updateValues.push(syncedAt); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    paramCount++;
    updateValues.push(recordId);

    const result = await query(`
      UPDATE medical_records 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, record_id, patient_id, diagnosis, severity, visit_date, is_synced, updated_at
    `, updateValues);

    const record = result.rows[0];

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: record
    });

  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ success: false, message: 'Server error updating record' });
  }
});

// @route   DELETE /api/records/:id
// @desc    Delete medical record
// @access  Private
router.delete('/:id', [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const recordId = parseInt(req.params.id);

    const result = await query('DELETE FROM medical_records WHERE id = $1 RETURNING id', [recordId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting record' });
  }
});

// @route   GET /api/records/patient/:patientId
// @desc    Get all records for a specific patient
// @access  Private
router.get('/patient/:patientId', [
  param('patientId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patientId = parseInt(req.params.patientId);

    const records = await queryAll(`
      SELECT 
        mr.id, mr.record_id, mr.diagnosis, mr.severity, mr.symptoms,
        mr.clinical_observations, mr.medications, mr.visit_date, mr.next_visit_date,
        mr.is_synced, mr.created_at,
        u.full_name as provider_name,
        f.name as facility_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.provider_id = u.id
      LEFT JOIN facilities f ON mr.facility_id = f.id
      WHERE mr.patient_id = $1
      ORDER BY mr.visit_date DESC
    `, [patientId]);

    res.json({
      success: true,
      data: records
    });

  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching patient records' });
  }
});

module.exports = router;