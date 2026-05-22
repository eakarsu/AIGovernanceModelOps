const express = require('express');

const router = express.Router();

function board(input = {}) {
  const exceptions = input.exceptions || [
    { model: 'Credit ranker v3', control: 'bias_threshold', owner: 'Risk', expires_in_days: 18, residual_risk: 'high' },
    { model: 'Support triage', control: 'human_review', owner: 'CX', expires_in_days: 42, residual_risk: 'medium' },
    { model: 'Fraud screen', control: 'data_lineage', owner: 'Trust', expires_in_days: 7, residual_risk: 'high' },
  ];
  return {
    waivers: exceptions.map((e) => ({
      ...e,
      approval_lane: e.residual_risk === 'high' || e.expires_in_days < 14 ? 'governance_council' : 'model_owner',
      status: e.expires_in_days < 10 ? 'renewal_due' : 'active_exception',
      required_evidence: ['risk acceptance memo', 'compensating control', 'expiration owner'],
    })),
  };
}

router.get('/', (req, res) => res.json(board()));
router.post('/review', (req, res) => res.json(board(req.body || {})));

module.exports = router;
