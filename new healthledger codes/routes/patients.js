const express = require('express');
const { query, queryOne, queryAll } = require('../config/database');
const { body, param, query: queryValidator, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients with pagination and search
// @access  Private
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  queryValidator('search').optional().isString(),
  queryValidator('verified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const verified = req.query.verified;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (p.full_name ILIKE $${paramCount} OR p.patient_id ILIKE $${paramCount} OR p.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (verified !== undefined) {
      paramCount++;
      whereClause += ` AND p.is_verified = $${paramCount}`;
      params.push(verified === 'true');
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM patients p ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get patients
    paramCount++;
    const patientsQuery = `
      SELECT 
        p.id, p.patient_id, p.full_name, p.date_of_birth, p.gender, p.phone, p.email,
        p.village, p.address, p.photo_url, p.is_verified, p.verification_method,
        p.registered_by, p.facility_id, p.created_at, p.updated_at,
        f.name as facility_name,
        u.full_name as registered_by_name
      FROM patients p
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN users u ON p.registered_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const patients = await queryAll(patientsQuery, params);

    res.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching patients' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private
router.get('/:id', [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patientId = parseInt(req.params.id);

    const patient = await queryOne(`
      SELECT 
        p.*,
        f.name as facility_name,
        u.full_name as registered_by_name
      FROM patients p
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN users u ON p.registered_by = u.id
      WHERE p.id = $1
    `, [patientId]);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching patient' });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private
router.post('/', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail(),
  body('village').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      fullName,
      patientId,
      dateOfBirth,
      gender,
      phone,
      email,
      village,
      address,
      photoUrl,
      idPhotoUrl,
      fingerprintId,
      isVerified = false,
      verificationMethod,
      facilityId
    } = req.body;

    // Check if patient ID already exists
    const existingPatient = await queryOne(
      'SELECT id FROM patients WHERE patient_id = $1',
      [patientId]
    );

    if (existingPatient) {
      return res.status(400).json({ 
        success: false,
        message: 'Patient with this ID already exists' 
      });
    }

    // Get facility ID from user if not provided
    let finalFacilityId = facilityId;
    if (!finalFacilityId) {
      const facility = await queryOne('SELECT id FROM facilities LIMIT 1');
      finalFacilityId = facility?.id;
    }

    const result = await query(`
      INSERT INTO patients (
        patient_id, full_name, date_of_birth, gender, phone, email, village, address,
        photo_url, id_photo_url, fingerprint_id, is_verified, verification_method, facility_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, patient_id, full_name, phone, email, village, is_verified, created_at
    `, [
      patientId, fullName, dateOfBirth, gender, phone, email, village, address,
      photoUrl, idPhotoUrl, fingerprintId, isVerified, verificationMethod, finalFacilityId
    ]);

    const patient = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });

  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ success: false, message: 'Server error creating patient' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private
router.put('/:id', [
  param('id').isInt(),
  body('fullName').optional().notEmpty(),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patientId = parseInt(req.params.id);
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      village,
      address,
      photoUrl,
      isVerified,
      verificationMethod
    } = req.body;

    // Check if patient exists
    const existingPatient = await queryOne('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (!existingPatient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (fullName !== undefined) { paramCount++; updateFields.push(`full_name = $${paramCount}`); updateValues.push(fullName); }
    if (dateOfBirth !== undefined) { paramCount++; updateFields.push(`date_of_birth = $${paramCount}`); updateValues.push(dateOfBirth); }
    if (gender !== undefined) { paramCount++; updateFields.push(`gender = $${paramCount}`); updateValues.push(gender); }
    if (phone !== undefined) { paramCount++; updateFields.push(`phone = $${paramCount}`); updateValues.push(phone); }
    if (email !== undefined) { paramCount++; updateFields.push(`email = $${paramCount}`); updateValues.push(email); }
    if (village !== undefined) { paramCount++; updateFields.push(`village = $${paramCount}`); updateValues.push(village); }
    if (address !== undefined) { paramCount++; updateFields.push(`address = $${paramCount}`); updateValues.push(address); }
    if (photoUrl !== undefined) { paramCount++; updateFields.push(`photo_url = $${paramCount}`); updateValues.push(photoUrl); }
    if (isVerified !== undefined) { paramCount++; updateFields.push(`is_verified = $${paramCount}`); updateValues.push(isVerified); }
    if (verificationMethod !== undefined) { paramCount++; updateFields.push(`verification_method = $${paramCount}`); updateValues.push(verificationMethod); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    paramCount++;
    updateValues.push(patientId);

    const result = await query(`
      UPDATE patients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, patient_id, full_name, phone, email, village, is_verified, updated_at
    `, updateValues);

    const patient = result.rows[0];

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ success: false, message: 'Server error updating patient' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private
router.delete('/:id', [
  param('id').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const patientId = parseInt(req.params.id);

    const result = await query('DELETE FROM patients WHERE id = $1 RETURNING id', [patientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting patient' });
  }
});

module.exports = router;