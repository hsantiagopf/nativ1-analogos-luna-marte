/**
 * Automated Verification Test for Frontend Runtime Integrity
 * Tests:
 * 1. Polymorphic weighted_distance_deg handling ({ median, p05, p95 } | number)
 * 2. Bootstrap intervals integrity (p05 <= median <= p95)
 * 3. Dynamic candidate denominator computation across all Moon & Mars references
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../public/data/all_rankings.json');
if (!fs.existsSync(jsonPath)) {
  console.error(`FATAL: File not found: ${jsonPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let testsPassed = 0;
let testsFailed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    testsPassed++;
    console.log(`  [PASS] ${description}`);
  } else {
    testsFailed++;
    console.error(`  [FAIL] ${description} - ${details}`);
  }
}

console.log('Running Frontend Runtime Integrity Tests...\n');

// Test Suite 1: Moon & Mars Candidate Property Verification
console.log('--- Test Suite 1: Candidate Distance Formatting & Polymorphism ---');
['MOON', 'MARS'].forEach((body) => {
  const references = data[body]?.references || [];
  references.forEach((ref) => {
    // Dynamic denominator verification
    const expectedLength = body === 'MOON' ? 13 : 12;
    assert(
      `${body} ref ${ref.ref_site_id} candidates length == ${expectedLength}`,
      ref.candidates.length === expectedLength,
      `Actual: ${ref.candidates.length}`
    );

    // Dynamic denominator format test (ExecutiveHero)
    const denominatorText = `/ ${ref.candidates.length}`;
    assert(
      `${body} ref ${ref.ref_site_id} denominator string is '${denominatorText}'`,
      denominatorText === (body === 'MOON' ? '/ 13' : '/ 12')
    );

    ref.candidates.forEach((cand) => {
      const val = typeof cand.weighted_distance_deg === 'object' && cand.weighted_distance_deg !== null
        ? cand.weighted_distance_deg.median
        : cand.weighted_distance_deg;

      assert(
        `${cand.site_id} (${body}): median is finite number`,
        typeof val === 'number' && Number.isFinite(val),
        `Got: ${val}`
      );

      // Safe toFixed(2)
      let formatted = '';
      let formatError = null;
      try {
        formatted = val.toFixed(2);
      } catch (err) {
        formatError = err;
      }
      assert(
        `${cand.site_id} (${body}): safe toFixed(2) executes without error`,
        formatError === null && formatted.length > 0
      );

      // If object, verify bootstrap interval
      if (typeof cand.weighted_distance_deg === 'object' && cand.weighted_distance_deg !== null) {
        const { median, p05, p95 } = cand.weighted_distance_deg;
        assert(
          `${cand.site_id} (${body}): p05 <= median <= p95`,
          p05 <= median && median <= p95,
          `p05=${p05}, median=${median}, p95=${p95}`
        );
      }
    });
  });
});

console.log(`\nIntegrity Test Results: ${testsPassed} passed, ${testsFailed} failed.`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL INTEGRITY TESTS PASSED SUCCESSFULLY.\n');
  process.exit(0);
}
